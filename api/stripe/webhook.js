import Stripe from 'stripe';
import nodemailer from 'nodemailer';
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

// Hos geldin maili icin mailer (auth ile ayni Gmail yapisi).
// EMAIL_USER / EMAIL_PASS .env'de tanimli olmali.
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Stripe Dashboard'daki Payment Link price ID'leri.
// Fiyat/urun degisirse buradaki ID'leri de guncellemen gerekir.
// NOT: Eski fiyatlara bagli aktif abone yoktu, o yuzden eski ID'ler kaldirildi.
// Ileride fiyat degistirirsen ve o sirada AKTIF ABONE varsa, eski ID'leri
// silme - yenileme odemeleri hala eski price ID ile geliyor.
const PRICE_TO_PLAN = {
  price_1U3k5JJ2CzqeTfs9MLJuUfZj: 'premium',
  price_1U3k5hJ2CzqeTfs9bLaXtA47: 'pro',
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
   HOS GELDIN MAILI
   ------------------------------------------------------------
   Sadece ILK satin almada (checkout.session.completed) ve
   abonelik daha once islenmediyse gonderilir. Mail gonderiminde
   bir sorun cikarsa webhook'u ASLA patlatmaz (try/catch icinde).
   ============================================================ */
async function sendWelcomeEmail(email, plan) {
  if (!email) return;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER/EMAIL_PASS tanimli degil -> hos geldin maili atlandi');
    return;
  }

  const planLabel = plan === 'pro' ? 'Pro' : 'Premium';

  const html = `
  <div style="margin:0;padding:0;background-color:#F6F3EC;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F3EC;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e0d3;">
            <tr>
              <td style="background-color:#1C2B4A;padding:28px 32px;text-align:center;">
                <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">checkyourwrite</div>
                <div style="color:#9C7A3C;font-size:12px;margin-top:6px;letter-spacing:2px;text-transform:uppercase;">Almanya yolculugunda yaninda</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;color:#1C2B4A;">
                <h1 style="margin:0 0 16px 0;font-size:22px;color:#1C2B4A;">Aramiza hos geldin! &#127881;</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#3a4560;">
                  Bize katildigin icin cok tesekkurler. Artik <strong style="color:#9C7A3C;">${planLabel}</strong> uyemizsin ve checkyourwrite'in tum ilgili ozelliklerine erisebilirsin.
                </p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#3a4560;">
                  Yazilarini kontrol etmekten ceviri oyununa, kelime kartlarindan rehberlere kadar her sey seni bekliyor. Istedigin zaman siteye giris yapip kaldigin yerden devam edebilirsin.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                  <tr>
                    <td style="background-color:#9C7A3C;border-radius:8px;">
                      <a href="https://checkyourwrite.com" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Siteye git &#8594;</a>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F3EC;border-radius:10px;border-left:4px solid #9C7A3C;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;color:#1C2B4A;">Fikrin bizim icin degerli &#128172;</p>
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#3a4560;">
                        Siteyle ilgili onerin, dusuncen ya da takildigin bir sey olursa bize ulasmaktan cekinme. Geri bildirimlerin checkyourwrite'i senin icin daha iyi yapmamiza yardimci oluyor.
                      </p>
                      <p style="margin:12px 0 0 0;font-size:14px;line-height:1.8;color:#3a4560;">
                        &#128233; Bu maile dogrudan cevap yazabilirsin<br>
                        &#128241; Instagram'dan <a href="https://instagram.com/deutschlandyusuf" style="color:#9C7A3C;font-weight:bold;text-decoration:none;">@deutschlandyusuf</a> DM atabilirsin
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px 32px;border-top:1px solid #eee6d8;text-align:center;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#9aa0ad;">
                  Sevgiler,<br>
                  <strong style="color:#1C2B4A;">deutschlandyusuf</strong> &middot; checkyourwrite.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    await mailer.sendMail({
      from: `checkyourwrite <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "checkyourwrite'a hos geldin - artik aramizdasin \u{1F389}",
      html,
    });
    console.log(`📧 Hos geldin maili gonderildi -> ${email} (${planLabel})`);
  } catch (e) {
    // Mail gitmezse webhook'u patlatma - odeme/plan zaten islendi.
    console.error('Hos geldin maili gonderilemedi:', e.message);
  }
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
        // Yeni/yenilenen aktif abonelikte iptal bayragi kalkar.
        cancel_at_period_end: false,
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
          // Bu abonelik daha once islendi mi? (Stripe ayni event'i tekrar
          // gonderebilir -> mukerrer hos geldin maili gitmesin.)
          const alreadyProcessed = await Subscription.findOne({
            stripe_subscription_id: subscription.id,
          }).lean();

          await setUserPlan({
            email: email.toLowerCase(),
            plan,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          });

          // Sadece ILK kez (yeni abonelik) hos geldin maili gonder.
          if (!alreadyProcessed) {
            await sendWelcomeEmail(email.toLowerCase(), plan);
          }
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

    // ── 3) Abonelik guncellendi (donem sonunda iptal planlandi / plan degisti) ──
    // Portaldan "iptal et" denince Stripe aboneligi hemen silmez; once
    // cancel_at_period_end = true yapip bu event'i gonderir. Plan donem
    // sonuna kadar aktif kalir, biz sadece iptal bayragini isaretliyoruz.
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const cancelAtPeriodEnd = !!subscription.cancel_at_period_end;
      try {
        const period = getPeriod(subscription);
        const update = { cancel_at_period_end: cancelAtPeriodEnd };
        if (period.end) update.current_period_end = period.end;
        await Subscription.findOneAndUpdate(
          { stripe_subscription_id: subscription.id },
          update
        );
        console.log(`🔄 abonelik ${subscription.id} -> cancel_at_period_end: ${cancelAtPeriodEnd}`);
      } catch (e) {
        console.error('Abonelik guncelleme kaydi yazilamadi:', e.message);
      }
    }

    // ── 4) Abonelik iptal edildi / sona erdi ──
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
          { status: 'canceled', cancel_at_period_end: false }
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
