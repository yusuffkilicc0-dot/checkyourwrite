import nodemailer from 'nodemailer';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';

const ALLOWED_ORIGIN = 'https://www.checkyourwrite.com';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Gecerli bir email gir' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await connectDB();

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({
        email: normalizedEmail,
        verification_token: code,
        verification_token_expires: expiresAt,
      });
    } else {
      user.verification_token = code;
      user.verification_token_expires = expiresAt;
    }

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: '✅ CheckYourWrite - Doğrulama Kodu',
      html: `
        <h2>CheckYourWrite - Email Doğrulaması</h2>
        <p>Doğrulama kodunuz: <strong>${code}</strong></p>
        <p>Kod 10 dakika içinde geçersiz olacaktır.</p>
        <p>Hesabını oluşturmadıysanız bu emaili yoksay.</p>
      `,
    });

    return res.status(200).json({ success: true, message: 'Kod gonderildi' });
  } catch (error) {
    console.error('send-verification hatasi:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatasi' });
  }
}
