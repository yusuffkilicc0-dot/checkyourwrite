// api/stripe/portal.js
// Kullanıcıyı Stripe müşteri portalına yönlendirir.
// flow_data ile direkt "iptal" veya "plan değiştir" ekranına açar.
// Body: { flow: 'cancel' } | { flow: 'update' } | {}

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { email: data.user.email, id: data.user.id };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Yalnızca POST destekleniyor.' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });

    // 1) Kullanıcının Stripe customer kaydını e-postasıyla bul
    let customerId = null;
    if (user.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
    }
    if (!customerId) {
      return res.status(404).json({ error: 'Aktif bir aboneliğiniz bulunamadı.' });
    }

    // 2) Aktif aboneliği bul (flow_data için gerekli)
    let subscriptionId = null;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (subs.data.length > 0) subscriptionId = subs.data[0].id;

    // 3) Portal oturumu — flow'a göre direkt ilgili ekrana aç
    const { flow } = req.body || {};
    const params = {
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/hesabim`,
    };

    if (flow === 'cancel' && subscriptionId) {
      params.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: { subscription: subscriptionId },
      };
    } else if (flow === 'update' && subscriptionId) {
      params.flow_data = {
        type: 'subscription_update',
        subscription_update: { subscription: subscriptionId },
      };
    }

    const session = await stripe.billingPortal.sessions.create(params);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[stripe/portal] hata:', err?.message, err?.raw?.code);
    if (err?.raw?.code === 'resource_missing') {
      return res.status(404).json({ error: 'Abonelik kaydınıza ulaşılamadı.' });
    }
    return res.status(500).json({ error: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.' });
  }
}
