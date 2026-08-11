import jwt from 'jsonwebtoken';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email ve kod gerekli' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await connectDB();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanici bulunamadi' });
    }

    if (!user.verification_token || user.verification_token !== code) {
      return res.status(400).json({ success: false, message: 'Kod yanlis' });
    }

    if (!user.verification_token_expires || new Date() > user.verification_token_expires) {
      return res.status(400).json({ success: false, message: 'Kod suresi doldu' });
    }

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    user.last_login = new Date();
    await user.save();

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET tanimli degil.');
      return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      plan: user.subscription_plan,
      message: 'Dogrulama basarili',
    });
  } catch (error) {
    console.error('verify-code hatasi:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
  }
}
