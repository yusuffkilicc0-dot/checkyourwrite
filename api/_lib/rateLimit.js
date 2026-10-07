import crypto from 'crypto';
import { RateLimit } from './models.js';

/* Sabit pencereli hız sınırı.
   Her (anahtar, zaman dilimi) için MongoDB'de tek bir sayaç tutulur ve atomik
   olarak artırılır; paralel istekler sayacı atlatamaz.
   Sınır içindeyse true, aşıldıysa false döner. */
export async function hit(key, limit, windowSec) {
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const id = `${key}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowSec * 1000);

  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt } };
  let doc;
  try {
    doc = await RateLimit.findOneAndUpdate({ _id: id }, update, { upsert: true, new: true });
  } catch (err) {
    // Aynı anda iki ilk istek insert'e yarışırsa biri E11000 alır; kayıt artık var, tekrar dene.
    if (!err || err.code !== 11000) throw err;
    doc = await RateLimit.findOneAndUpdate({ _id: id }, update, { new: true });
  }
  return doc.count <= limit;
}

/* İstemci IP'si (Vercel x-forwarded-for başlığını kendisi set eder). */
export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

/* Sayaç anahtarında e-posta düz metin olarak saklanmasın. */
export function hashKey(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}
