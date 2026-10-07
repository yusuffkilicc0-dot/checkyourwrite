import jwt from 'jsonwebtoken';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';
const MAX_ATTEMPTS = 5; // kod basina en fazla yanlis deneme

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

    if (!user.verification_token) {
      return res.status(400).json({ success: false, message: 'Kod yanlis' });
    }

    // ── Brute-force korumasi ──
    // Deneme hakkini kodu karsilastirmadan ONCE ve atomik olarak dusuruyoruz.
    // Boylece paralel gelen yuzlerce istek bile MAX_ATTEMPTS sinirini asamaz.
    // Eski kayitlarda alan hic yok; $exists:false o durumu da kapsar.
    const counted = await User.findOneAndUpdate(
      {
        _id: user._id,
        verification_token: user.verification_token,
        $or: [
          { verification_attempts: { $lt: MAX_ATTEMPTS } },
          { verification_attempts: { $exists: false } },
        ],
      },
      { $inc: { verification_attempts: 1 } },
      { new: true }
    );

    if (!counted) {
      await User.updateOne(
        { _id: user._id, verification_token: user.verification_token },
        { $set: { verification_token: null, verification_token_expires: null } }
      );
      return res.status(429).json({ success: false, message: 'Cok fazla yanlis deneme. Lutfen yeni kod iste.' });
    }

    if (!user.verification_token_expires || new Date() > user.verification_token_expires) {
      return res.status(400).json({ success: false, message: 'Kod suresi doldu' });
    }

    if (user.verification_token !== String(code)) {
      if (counted.verification_attempts >= MAX_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id, verification_token: user.verification_token },
          { $set: { verification_token: null, verification_token_expires: null } }
        );
        return res.status(429).json({ success: false, message: 'Cok fazla yanlis deneme. Lutfen yeni kod iste.' });
      }
      return res.status(400).json({ success: false, message: 'Kod yanlis' });
    }

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    user.verification_attempts = 0;
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
