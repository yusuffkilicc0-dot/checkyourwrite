import { User } from './models.js';

/* Mündlich Pratik — günlük AI değerlendirme hakkı.
   null = sınırsız (sadece admin). Pro için 50 = adil kullanım sınırı (API maliyetini korur).
   Sadece AI değerlendirmesi (api/oral-feedback) hak düşer. */
export const ORAL_DAILY_LIMITS = { free: 3, premium: 10, pro: 50 };
const ADMIN_EMAILS = ['yusuffkilicc0@gmail.com'];

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC, analyze.js ile aynı)
}

export function oralLimitFor(user) {
  if (ADMIN_EMAILS.includes((user.email || '').toLowerCase())) return null;
  const plan = user.subscription_plan || 'free';
  return plan in ORAL_DAILY_LIMITS ? ORAL_DAILY_LIMITS[plan] : ORAL_DAILY_LIMITS.free;
}

/* İstemciye gösterilecek kota durumu. */
export function oralUsage(user) {
  const limit = oralLimitFor(user);
  const used = user.oral_usage_date === todayKey() ? (user.oral_usage_count || 0) : 0;
  return {
    plan: user.subscription_plan || 'free',
    limit,
    used,
    remaining: limit === null ? null : Math.max(0, limit - used),
  };
}

/* Bir hak düşer. Hak yoksa { ok:false }. Atomik: paralel istekler sınırı aşamaz. */
export async function consumeOral(user) {
  const limit = oralLimitFor(user);
  if (limit === null) return { ok: true, usage: oralUsage(user) };

  const today = todayKey();
  // Gün değiştiyse sayacı sıfırla (koşullu: sadece bir istek sıfırlayabilir).
  await User.updateOne(
    { _id: user._id, oral_usage_date: { $ne: today } },
    { $set: { oral_usage_date: today, oral_usage_count: 0 } }
  );
  const updated = await User.findOneAndUpdate(
    { _id: user._id, oral_usage_date: today, oral_usage_count: { $lt: limit } },
    { $inc: { oral_usage_count: 1 } },
    { new: true }
  );
  if (!updated) {
    return { ok: false, usage: { plan: user.subscription_plan || 'free', limit, used: limit, remaining: 0 } };
  }
  return { ok: true, usage: oralUsage(updated) };
}

/* Değerlendirme başarısız olduysa düşülen hakkı geri ver. */
export async function refundOral(user) {
  if (oralLimitFor(user) === null) return;
  await User.updateOne(
    { _id: user._id, oral_usage_date: todayKey(), oral_usage_count: { $gt: 0 } },
    { $inc: { oral_usage_count: -1 } }
  );
}
