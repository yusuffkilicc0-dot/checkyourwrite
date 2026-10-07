import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';
import { hit, clientIp, hashKey } from '../_lib/rateLimit.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

function generateCode() {
  // Kriptografik olarak guvenli rastgele kod (Math.random tahmin edilebilir)
  return crypto.randomInt(100000, 1000000).toString();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
    return res.status(400).json({ success: false, message: 'Geçerli bir email adresi gir.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await connectDB();

    // ── Spam koruması ──
    // Aynı adrese: 60 sn'de 1, saatte 5 kod. Aynı IP'den: saatte 20 istek
    // (farklı adreslerle Gmail gönderim kotasını doldurmayı engeller).
    const emailKey = hashKey(normalizedEmail);
    if (!(await hit(`send-email-1m:${emailKey}`, 1, 60))) {
      return res.status(429).json({ success: false, message: 'Kod az önce gönderildi. Yeni kod için 1 dakika bekle.' });
    }
    if (!(await hit(`send-email-1h:${emailKey}`, 5, 3600))) {
      return res.status(429).json({ success: false, message: 'Bu adrese çok fazla kod istendi. Lütfen daha sonra tekrar dene.' });
    }
    if (!(await hit(`send-ip-1h:${clientIp(req)}`, 20, 3600))) {
      return res.status(429).json({ success: false, message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar dene.' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    // ── Atomik upsert ──
    // findOne + new + save yerine tek atomik işlem kullanıyoruz. Böylece
    // "Kod Gönder"e hızlı iki kez basılıp iki istek yarışsa bile, MongoDB
    // email üzerinde tek kayıt tutar (çift-kayıt race condition çözümü).
    // $setOnInsert: sadece YENİ kayıt oluşurken uygulanır (mevcut planı/tarihi ezmez).
    try {
      await User.findOneAndUpdate(
        { email: normalizedEmail },
        {
          $set: {
            verification_token: code,
            verification_token_expires: expiresAt,
            verification_attempts: 0,
          },
          $setOnInsert: {
            email: normalizedEmail,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (err) {
      // Nadir yarış durumunda iki istek aynı anda insert etmeye çalışırsa
      // biri E11000 duplicate key hatası alır. Bu aslında "istenen sonuç"
      // (kayıt zaten var); ikinci bir update ile kodu güncelleyip devam ediyoruz.
      if (err && err.code === 11000) {
        await User.updateOne(
          { email: normalizedEmail },
          {
            $set: {
              verification_token: code,
              verification_token_expires: expiresAt,
              verification_attempts: 0,
            },
          }
        );
      } else {
        throw err;
      }
    }

    await transporter.sendMail({
      from: `"CheckYourWrite" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: `${code} — CheckYourWrite doğrulama kodun`,
      html: `
<!DOCTYPE html>
<html lang="tr">
<body style="margin:0; padding:0; background-color:#f5f4f0; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px; background-color:#ffffff; border:1px solid #e2e0da; border-radius:12px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 0 32px;" align="center">
              <span style="font-family:'Courier New', Courier, monospace; font-size:18px; font-weight:bold; color:#1a1916; letter-spacing:-0.5px;">check<span style="color:#8a8880;">yourwrite</span></span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:28px 32px 8px 32px;" align="center">
              <span style="font-size:17px; color:#1a1916; font-weight:bold;">Email doğrulama</span>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px 32px;" align="center">
              <span style="font-size:14px; color:#8a8880; line-height:1.6;">Giriş yapmak için aşağıdaki kodu kullan:</span>
            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:0 32px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0; border:1px solid #e2e0da; border-radius:10px;">
                <tr>
                  <td style="padding:18px 40px;" align="center">
                    <span style="font-family:'Courier New', Courier, monospace; font-size:32px; font-weight:bold; letter-spacing:8px; color:#1a1916;">${code}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:20px 32px 8px 32px;" align="center">
              <span style="font-size:13px; color:#8a8880;">Bu kod <strong style="color:#2d6a4f;">10 dakika</strong> boyunca geçerlidir.</span>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:8px 32px 28px 32px;" align="center">
              <span style="font-size:12px; color:#b0aea6; line-height:1.6;">Bu isteği sen yapmadıysan bu emaili görmezden gelebilirsin.<br>Hesabında herhangi bir değişiklik yapılmaz.</span>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #e2e0da;" align="center">
              <span style="font-family:'Courier New', Courier, monospace; font-size:11px; color:#b0aea6;">checkyourwrite.com · Almanca Metin Düzeltici</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return res.status(200).json({ success: true, message: 'Kod gönderildi' });
  } catch (error) {
    console.error('send-verification hatasi:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası, lütfen tekrar dene.' });
  }
}
