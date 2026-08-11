import Stripe from 'stripe';
import { connectDB } from '../_lib/db.js';
import { User, Subscription } from '../_lib/models.js';

// Vercel'in body'yi otomatik JSON'a çevirmesini kapatiyoruz -
// Stripe imza dogrulamasi icin RAW (ham) body gerekiyor.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Dashboard'daki Payment Link price ID'leri.
// Fiyat/urun degisirse buradaki ID'leri de guncellemen gerekir.
const PRICE_TO_PLAN = {
  price_1TVfjwJ2CzqeTfs9izt8smYC: 'premium',
  price_1TVfsNJ2CzqeTfs9hCyOzD93: 'pro',
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function setUserPlan({ email, plan, stripeCustomerId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd }) {
  const user = await User.findOne({ email });
  if (!user) {
    console.warn('Webhook: bu email ile kullanici bulunamadi ->', email);
    return;
  }

  user.subscription_plan = plan;
  if (stripeCustomerId) user.stripe_customer_id = stripeCustomerId;
  await user.save();

  if (stripeSubscriptionId) {
    await Subscription.findOneAndUpdate(
      { stripe_subscription_id: stripeSubscriptionId },
      {
        user_id: user._id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        plan,
        status: 'active',
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ ${email} -> ${plan} olarak guncellendi`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook imza hatasi:', error.message);
    return res.status(400).json({ error: 'Webhook signature dogrulamasi basarisiz' });
  }

  try {
    await connectDB();

    // Ilk odeme - Stripe Payment Link / Checkout tamamlandiginda tetiklenir
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;

      if (email && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription, {
          expand: ['items.data.price'],
        });
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];

        if (plan) {
          await setUserPlan({
            email: email.toLowerCase(),
            plan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        } else {
          console.warn('Webhook: bilinmeyen price ID ->', priceId);
        }
      }
    }

    // Yenileme odemesi basarili
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
          expand: ['items.data.price'],
        });
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;

        if (plan && email) {
          await setUserPlan({
            email: email.toLowerCase(),
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
      }
    }

    // Abonelik iptal edildi / sona erdi
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const customer = await stripe.customers.retrieve(customerId);
      const email = customer.email;

      if (email) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.subscription_plan = 'free';
          await user.save();
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: subscription.id },
            { status: 'canceled' }
          );
          console.log(`❌ ${email} -> free plana dondu`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook isleme hatasi:', error);
    return res.status(500).json({ error: 'Server hatasi' });
  }
}
