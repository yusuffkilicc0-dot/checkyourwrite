import { connectDB } from '../_lib/db.js';
import { Correction } from '../_lib/models.js';
import { verifyAuth } from '../_lib/auth.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const auth = verifyAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Token gerekli veya gecersiz' });

  try {
    await connectDB();

    const corrections = await Correction.find({ user_id: auth.userId })
      .sort({ created_at: -1 })
      .limit(50);

    return res.status(200).json({ success: true, corrections });
  } catch (error) {
    console.error('corrections hatasi:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
  }
}
