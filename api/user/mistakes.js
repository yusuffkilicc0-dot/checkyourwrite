import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';
import { verifyAuth } from '../_lib/auth.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';
const MAX_ITEMS = 500;          // doküman şişmesin
const LEVELS = ['A2', 'B1', 'B2', 'C1'];

/* Gelen veriyi temizle — istemciden gelen hiçbir şeye güvenme */
function clean(item) {
  if (!item || typeof item.tr !== 'string') return null;
  const tr = item.tr.trim();
  if (!tr) return null;
  return {
    tr:    tr.slice(0, 300),
    de:    String(item.de || '').slice(0, 300),
    lvl:   LEVELS.indexOf(item.lvl) > -1 ? item.lvl : 'A2',
    wrong: Math.max(0, Math.min(Number(item.wrong) || 0, 999)),
    right: Math.max(0, Math.min(Number(item.right) || 0, 999)),
    done:  !!item.done,
    ts:    Number(item.ts) > 0 ? Number(item.ts) : Date.now()
  };
}

/* İki listeyi birleştir — her cümle için ZAMAN DAMGASI YENİ OLAN kazanır.
   Bu sayede telefondaki ilerleme, bilgisayardaki eski kayıt tarafından ezilmez. */
function merge(existing, incoming) {
  const map = new Map();
  (existing || []).forEach(function (it) {
    const c = clean(it);
    if (c) map.set(c.tr, c);
  });
  (incoming || []).forEach(function (it) {
    const c = clean(it);
    if (!c) return;
    const old = map.get(c.tr);
    if (!old || c.ts >= old.ts) map.set(c.tr, c);
  });

  let out = Array.from(map.values());
  // Sınırı aşarsa: önce öğrenilmişleri (done) at, sonra en eskileri at
  if (out.length > MAX_ITEMS) {
    out.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.ts - a.ts;
    });
    out = out.slice(0, MAX_ITEMS);
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Token gerekli veya gecersiz' });

  try {
    await connectDB();

    // lean() ham dokümanı verir — şemada tanımlı olmayan alanlar da gelir
    const user = await User.findById(auth.userId).select('subscription_plan mistakes').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Kullanici bulunamadi' });

    // Cihazlar arası senkron sadece Pro'da
    if (user.subscription_plan !== 'pro') {
      return res.status(403).json({ success: false, pro_required: true, message: 'Bu ozellik Pro uyelere ozel' });
    }

    const current = Array.isArray(user.mistakes) ? user.mistakes : [];

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, mistakes: current });
    }

    // PUT — istemcinin listesiyle birleştir, kaydet, birleşmiş halini geri döndür
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const incoming = body && Array.isArray(body.mistakes) ? body.mistakes : [];
    if (incoming.length > MAX_ITEMS * 2) {
      return res.status(400).json({ success: false, message: 'Cok fazla kayit' });
    }

    const merged = merge(current, incoming);

    // strict:false → alan sema'da tanimli olmasa bile yazilir
    await User.findByIdAndUpdate(
      auth.userId,
      { $set: { mistakes: merged } },
      { strict: false }
    );

    return res.status(200).json({ success: true, mistakes: merged });

  } catch (error) {
    console.error('mistakes hatasi:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
  }
}
