import { connectDB } from './_lib/db.js';
import { User, OralSession } from './_lib/models.js';
import { verifyAuth } from './_lib/auth.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';
const ADMIN_EMAILS = ['yusuffkilicc0@gmail.com'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ error: 'Giris gerekli.' });

  try {
    await connectDB();

    const user = await User.findById(auth.userId);
    const email = (user?.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Bu ozellik su an gelistirme asamasinda.' });
    }

    // ── Kaydet ──
    if (req.method === 'POST') {
      const b = req.body || {};
      const doc = await OralSession.create({
        user_id: user._id,
        mode: b.mode || null,
        mode_label: b.mode_label || null,
        topic: b.topic || null,
        ai_score: (typeof b.ai_score === 'number') ? b.ai_score : null,
        ai_label: b.ai_label || null,
        ai_summary: b.ai_summary || null,
        ai_criteria: Array.isArray(b.ai_criteria) ? b.ai_criteria.map(c => ({ name: c.name, score: c.score })) : [],
        self_ratings: b.self_ratings || {},
        notes: (b.notes || '').slice(0, 2000),
      });
      return res.status(200).json({ success: true, id: doc._id });
    }

    // ── Listele ──
    if (req.method === 'GET') {
      const sessions = await OralSession.find({ user_id: user._id })
        .sort({ created_at: -1 })
        .limit(100);
      return res.status(200).json({ success: true, sessions });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('oral-sessions hatasi:', e);
    return res.status(500).json({ error: 'Sunucu hatasi.' });
  }
}
