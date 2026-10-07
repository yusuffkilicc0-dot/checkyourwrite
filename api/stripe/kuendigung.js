// api/stripe/kuendigung.js
// §312k BGB "Kündigungsbutton": giriş yapmadan abonelik feshi.
// Akış: /kuendigen.html formu → bu endpoint → Stripe'ta dönem sonunda iptal
// (cancel_at_period_end) → webhook veritabanını günceller → kullanıcıya ve
// site sahibine "Textform" onay e-postası. Beyan, ispat için MongoDB'de saklanır.
//
// Güvenlik: Yanıt, e-postaya ait abonelik olup olmadığını ele vermez (genel mesaj).
// Başkası adına yapılan kötü niyetli fesih, onay e-postasındaki portal linkiyle
// kullanıcı tarafından geri alınabilir (dönem sonuna kadar abonelik devam eder).

import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { connectDB } from '../_lib/db.js';
import { User, CancellationRequest } from '../_lib/models.js';
import { hit, clientIp, hashKey } from '../_lib/rateLimit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.checkyourwrite.com';

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}
function fmtDateTime(d) {
  return new Date(d).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'long', timeStyle: 'medium' }) + ' Uhr';
}
// Stripe API'nin yeni sürümlerinde dönem sonu abonelik kaleminde (item) duruyor
function periodEnd(sub) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  const ts = sub.current_period_end ?? (item && item.current_period_end) ?? sub.cancel_at;
  return ts ? new Date(ts * 1000) : null;
}
function planOf(sub) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  const nick = item && item.price && (item.price.nickname || item.price.lookup_key);
  return nick || 'Abonnement';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const b = req.body || {};
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 120) : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase().slice(0, 254) : '';
  const kind = b.kind === 'ausserordentlich' ? 'ausserordentlich' : 'ordentlich';
  const reason = typeof b.reason === 'string' ? b.reason.trim().slice(0, 1000) : '';
  const requestedDate = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : '';

  if (!name || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Bitte geben Sie Ihren Namen und die E-Mail-Adresse Ihres Kontos an.' });
  }
  if (kind === 'ausserordentlich' && !reason) {
    return res.status(400).json({ success: false, message: 'Bitte geben Sie für eine außerordentliche Kündigung einen Grund an.' });
  }

  const receivedAt = new Date();
  try {
    await connectDB();

    // Spam koruması (aynı e-postaya saatte 3, aynı IP'den saatte 10 beyan)
    if (!(await hit(`kuendigung-ip:${clientIp(req)}`, 10, 3600)) ||
        !(await hit(`kuendigung-mail:${hashKey(email)}`, 3, 3600))) {
      return res.status(429).json({ success: false, message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut oder schreiben Sie uns per E-Mail.' });
    }

    // Stripe müşterisini bul: önce kayıtlı ID, yoksa e-posta ile ara
    const user = await User.findOne({ email }).select('stripe_customer_id');
    let customerIds = [];
    if (user && user.stripe_customer_id) customerIds.push(user.stripe_customer_id);
    const byMail = await stripe.customers.list({ email, limit: 5 });
    byMail.data.forEach(c => { if (!customerIds.includes(c.id)) customerIds.push(c.id); });

    // Aktif abonelikleri dönem sonunda sonlandır
    const cancelled = [];
    for (const customer of customerIds) {
      const subs = await stripe.subscriptions.list({ customer, status: 'all', limit: 10 });
      for (const sub of subs.data) {
        if (!['active', 'trialing', 'past_due'].includes(sub.status)) continue;
        const updated = sub.cancel_at_period_end || sub.cancel_at
          ? sub
          : await stripe.subscriptions.update(sub.id, {
              cancel_at_period_end: true,
              metadata: { kuendigung_via: 'kuendigungsbutton', kuendigung_at: receivedAt.toISOString() },
            });
        cancelled.push({ id: sub.id, plan: planOf(updated), ends_at: periodEnd(updated) });
      }
    }

    await CancellationRequest.create({
      name, email, kind, reason, requested_date: requestedDate,
      received_at: receivedAt, matched: cancelled.length > 0, subscriptions: cancelled, ip: clientIp(req),
    });

    // Kullanıcıya Textform onayı (§312k Abs. 4 BGB)
    const endLines = cancelled.length
      ? cancelled.map(c => `<li>${esc(c.plan)}: endet zum <strong>${fmtDate(c.ends_at)}</strong></li>`).join('')
      : '';
    const statusHtml = cancelled.length
      ? `<p>Ihr Abonnement wurde gekündigt. Bis zum Ende des bezahlten Zeitraums können Sie alle Funktionen weiter nutzen:</p><ul>${endLines}</ul>`
      : `<p>Zu dieser E-Mail-Adresse konnten wir kein aktives Abonnement finden. Falls Sie mit einer anderen Adresse bezahlt haben, antworten Sie bitte einfach auf diese E-Mail – wir kümmern uns darum.</p>`;
    await mailer.sendMail({
      from: `"CheckYourWrite" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: process.env.EMAIL_USER,
      subject: 'Eingangsbestätigung Ihrer Kündigung – CheckYourWrite',
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px;">
        <h2 style="font-size:18px;">Eingangsbestätigung Ihrer Kündigung</h2>
        <p>Hallo ${esc(name)},</p>
        <p>wir bestätigen den Eingang Ihrer Kündigungserklärung am <strong>${fmtDateTime(receivedAt)}</strong>.</p>
        <table style="font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Name</td><td>${esc(name)}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">E-Mail</td><td>${esc(email)}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Art</td><td>${kind === 'ausserordentlich' ? 'Außerordentliche Kündigung' : 'Ordentliche Kündigung zum nächstmöglichen Zeitpunkt'}</td></tr>
          ${reason ? `<tr><td style="padding:2px 12px 2px 0;color:#666;">Grund</td><td>${esc(reason)}</td></tr>` : ''}
          ${requestedDate ? `<tr><td style="padding:2px 12px 2px 0;color:#666;">Gewünschter Zeitpunkt</td><td>${fmtDate(requestedDate)}</td></tr>` : ''}
        </table>
        ${statusHtml}
        <p style="font-size:13px;color:#666;">Sie haben diese Kündigung nicht selbst veranlasst? Dann können Sie sie bis zum Ende des Zeitraums in Ihrem Konto unter <a href="${SITE}/dashboard.html">${SITE}/dashboard.html</a> rückgängig machen oder auf diese E-Mail antworten.</p>
        <p style="font-size:13px;color:#666;">CheckYourWrite · ${esc(SITE)}</p>
      </div>`,
    });

    // Site sahibine bildirim (özellikle eşleşmeyen veya olağanüstü fesihler elle kontrol için)
    try {
      await mailer.sendMail({
        from: `"CheckYourWrite" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `Kündigung eingegangen: ${email}${cancelled.length ? '' : ' (KEIN Abo gefunden)'}${kind === 'ausserordentlich' ? ' – AUSSERORDENTLICH' : ''}`,
        text: `Eingang: ${fmtDateTime(receivedAt)}\nName: ${name}\nE-Mail: ${email}\nArt: ${kind}\nGrund: ${reason || '-'}\nWunschtermin: ${requestedDate || '-'}\nAbos: ${cancelled.map(c => `${c.id} (${c.plan}) bis ${fmtDate(c.ends_at)}`).join(', ') || 'keins gefunden'}`,
      });
    } catch (e) { console.error('kuendigung admin mail hatasi:', e?.message); }

    // Genel yanıt: abonelik olup olmadığını ifşa etmez
    return res.status(200).json({ success: true, received_at: receivedAt.toISOString(), received_at_text: fmtDateTime(receivedAt) });
  } catch (err) {
    console.error('[stripe/kuendigung] hata:', err?.message, err?.raw?.code);
    return res.status(500).json({
      success: false,
      message: 'Ihre Kündigung konnte gerade nicht automatisch verarbeitet werden. Bitte senden Sie sie per E-Mail an ' + (process.env.EMAIL_USER || 'uns') + ' – sie ist damit ebenfalls wirksam.',
    });
  }
}
