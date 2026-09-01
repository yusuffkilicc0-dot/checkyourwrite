// api/stripe/portal.js
// Kullaniciyi Stripe musteri portalina yonlendirir.
// flow_data ile direkt "iptal" veya "plan degistir" ekranina acar.
// Body: { flow: 'cancel' } | { flow: 'update' } | {}
//
// NOT: Auth, sitenin geri kalaniyla ayni sistemi kullanir:
// verifyAuth(req) -> JWT dogrular -> auth.userId ile Mongo'dan kullanici bulunur.

import Stripe from 'stripe';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';
import { verifyAuth } from '../_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Yalnizca POST destekleniyor.' });
  }

  // 1) Kullaniciyi dogrula (site geneliyle ayni JWT sistemi)
  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Bu islem icin giris yapmalisiniz.' });

  try {
    await connectDB();

    const user = await User.findById(auth.userId).select('email stripe_customer_id');
    if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi.' });

    // 2) Stripe customer'i bul:
    //    once Mongo'daki kayitli ID'yi kullan, yoksa email ile Stripe'ta ara.
    let customerId = user.stripe_customer_id || null;

    if (!customerId && user.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) customerId = existing.data[0].id;
    }

    if (!customerId) {
      return res.status(404).json({ error: 'Aktif bir aboneliginiz bulunamadi.' });
    }

    // 3) Aktif aboneligi bul (flow_data icin gerekli)
    let subscriptionId = null;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (subs.data.length > 0) subscriptionId = subs.data[0].id;

    // 4) Portal oturumu — flow'a gore direkt ilgili ekrana ac
    const { flow } = req.body || {};
    const params = {
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard.html`,
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
      return res.status(404).json({ error: 'Abonelik kaydiniza ulasilamadi.' });
    }
    return res.status(500).json({ error: 'Bir seyler ters gitti. Lutfen tekrar deneyin.' });
  }
}
