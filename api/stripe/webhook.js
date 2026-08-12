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

/* ============================================================
   API SURUMU UYUMLULUK YARDIMCILARI
   ------------------------------------------------------------
   Stripe'in 2025-03-31 "Basil" surumunde bazi alanlar yer degistirdi:
     - subscription.current_period_start/end  ->  items.data[0].current_period_start/end
     - invoice.subscription                   ->  invoice.parent.subscription_details.subscription
   Asagidaki yardimcilar HER IKI sekli de destekler, boylece hesabin
   API surumu ne olursa olsun (ve ileride degisse de) kod calisir.
   ============================================================ */

// Abonelik doneminin baslangic/bitisini iki olasi yerden de okur.
function getPeriod(subscription) {
  const item = subscription?.items?.data?.[0];

  const startRaw =
    subscription?.current_period_start ??  // eski sekil
    item?.current_period_start;            // yeni sekil (Basil+)
  const endRaw =
    subscription?.current_period_end ??
    item?.current_period_end;

  return {
    start: toDateOrNull(startRaw),
    end: toDateOrNull(endRaw),
  };
}

// Unix saniyeyi Date'e cevirir; gecersizse null doner
// (gecersiz Date Mongoose'da CastError firlatiyor - bunu onluyoruz).
function toDateOrNull(unixSeconds) {
  if (typeof unixSeconds !== 'number' || !isFinite(unixSeconds)) return null;
  const d = new Date(unixSeconds * 1000);
  return isNaN(d.getTime()) ? null : d;
}

// Fatura uzerinden abonelik ID'sini iki olasi yerden de okur.
function getSubscriptionIdFromInvoice(invoice) {
  if (typeof invoice?.subscription === 'string') return invoice.subscription;      // eski sekil
  if (invoice?.subscription?.id) return invoice.subscription.id;
  const fromParent = invoice?.parent?.subscription_details?.subscription;          // yeni sekil (Basil+)
  if (typeof fromParent === 'string') return fromParent;
  if (fromParent?.id) return fromParent.id;
  // Bazi surumlerde satir bazinda da bulunabiliyor
  const fromLine = invoice?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
  if (typeof fromLine === 'string') return fromLine;
  return null;
}

async function setUserPlan({ email, plan, stripeCustomerId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd }) {
  const user = await User.findOne({ email });
  if (!user) {
    // Odeme yapildi ama bu email ile kayitli kullanici yok.
    // Bu ciddi bir durum: para alindi, plan verilemedi. Logda net gorunsun.
    console.error('🚨 ODEME ALINDI AMA KULLANICI YOK ->', email, '| plan:', plan);
    return;
  }

  user.subscription_plan = plan;
  if (stripeCustomerId) user.stripe_customer_id = stripeCustomerId;
  await user.save();
  console.log(`✅ ${email} -> ${plan} olarak guncellendi`);

  // Abonelik kaydi ikincil onemde: burada bir sorun cikarsa
  // kullanicinin plani zaten verilmis oluyor, webhook'u patlatmiyoruz.
  if (stripeSubscriptionId) {
    try {
      const doc = {
        user_id: user._id,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        plan,
        status: 'active',
      };
      // Tarihleri sadece gecerliyse yaz (gecersiz Date CastError firlatir).
      if (currentPeriodStart) doc.current_period_start = currentPeriodStart;
      if (currentPeriodEnd) doc.current_period_end = currentPeriodEnd;

      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: stripeSubscriptionId },
        doc,
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error('Abonelik kaydi yazilamadi (plan yine de verildi):', e.message);
    }
  }
}

// Musterinin emailini guvenli sekilde alir (silinmis musteri olabilir).
async function getCustomerEmail(customerId) {
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && customer.email) return customer.email;
  } catch (e) {
    console.error('Musteri bilgisi alinamadi:', e.message);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    // Imza dogrulanamadi -> 400 dogru cevap (Stripe tekrar denemesin).
    console.error('Webhook imza hatasi:', error.message);
    return res.status(400).json({ error: 'Webhook signature dogrulamasi basarisiz' });
  }

  try {
    await connectDB();

    // ── 1) Ilk odeme: Payment Link / Checkout tamamlandi ──
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

      if (email && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        });
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];
        const period = getPeriod(subscription);

        if (plan) {
          await setUserPlan({
            email: email.toLowerCase(),
            plan,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });
        } else {
          console.warn('Webhook: bilinmeyen price ID ->', priceId);
        }
      } else {
        console.warn('Webhook: checkout.session.completed icinde email veya subscription yok');
      }
    }

    // ── 2) Yenileme odemesi basarili ──
    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      const subscriptionId = getSubscriptionIdFromInvoice(invoice);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price'],
        });
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId];
        const period = getPeriod(subscription);
        const email = invoice.customer_email || (await getCustomerEmail(customerId));

        if (plan && email) {
          await setUserPlan({
            email: email.toLowerCase(),
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });
        } else {
          console.warn('Webhook (yenileme): plan veya email bulunamadi. price:', priceId, 'email:', email);
        }
      }
    }

    // ── 3) Abonelik iptal edildi / sona erdi ──
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      const email = await getCustomerEmail(customerId);

      if (email) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.subscription_plan = 'free';
          await user.save();
          console.log(`❌ ${email} -> free plana dondu`);
        }
      }
      // Abonelik kaydini her halukarda iptal olarak isaretle
      try {
        await Subscription.findOneAndUpdate(
          { stripe_subscription_id: subscription.id },
          { status: 'canceled' }
        );
      } catch (e) {
        console.error('Abonelik iptal kaydi yazilamadi:', e.message);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    // Beklenmedik hata: logla ama 200 don.
    // 500 donersek Stripe saatlerce tekrar dener ve sonunda endpoint'i kapatabilir.
    // Kritik islem (plan atama) zaten yukarida kendi try/catch'i icinde.
    console.error('Webhook isleme hatasi:', event?.type, error);
    return res.status(200).json({ received: true, warning: 'islenirken hata olustu, log kontrol edin' });
  }
}
