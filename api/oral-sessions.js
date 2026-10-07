import { connectDB } from './_lib/db.js';
import { User, OralSession } from './_lib/models.js';
import { verifyAuth } from './_lib/auth.js';
import { oralUsage } from './_lib/oralQuota.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

function str(v, max) {
  return typeof v === 'string' ? v.slice(0, max) : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Giriş gerekli.' });

  try {
    await connectDB();

    const user = await User.findById(auth.userId);
    if (!user) return res.status(401).json({ error: 'Oturum geçersiz, lütfen tekrar giriş yap.' });

    // ── Kaydet ──
    if (req.method === 'POST') {
      const b = req.body || {};
      const doc = await OralSession.create({
        user_id: user._id,
        mode: str(b.mode, 40),
        mode_label: str(b.mode_label, 80),
        topic: str(b.topic, 200),
        ai_score: (typeof b.ai_score === 'number') ? Math.max(0, Math.min(100, b.ai_score)) : null,
        ai_label: str(b.ai_label, 80),
        ai_summary: str(b.ai_summary, 1500),
        ai_criteria: Array.isArray(b.ai_criteria)
          ? b.ai_criteria.slice(0, 10).map(c => ({ name: str(c && c.name, 80), score: Number(c && c.score) || 0 }))
          : [],
        self_ratings: (b.self_ratings && typeof b.self_ratings === 'object') ? b.self_ratings : {},
        notes: (typeof b.notes === 'string' ? b.notes : '').slice(0, 2000),
      });
      return res.status(200).json({ success: true, id: doc._id });
    }

    // ── Listele (+ bugünkü AI değerlendirme hakkı) ──
    if (req.method === 'GET') {
      const sessions = await OralSession.find({ user_id: user._id })
        .sort({ created_at: -1 })
        .limit(100);
      return res.status(200).json({ success: true, sessions, usage: oralUsage(user) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('oral-sessions hatasi:', e);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}
