const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter konfigürasyonu
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verification kodu oluştur
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-verification
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({ success: false, message: 'Email gerekli' });
    }
    
    // Verification kodu oluştur
    const code = generateCode();
    const expiresIn = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika
    
    // Veya user varsa güncelle, yoksa oluştur
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        verification_token: code,
        verification_token_expires: expiresIn
      });
    } else {
      user.verification_token = code;
      user.verification_token_expires = expiresIn;
    }
    
    await user.save();
    
    // Email gönder
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ CheckYourWrite - Doğrulama Kodu',
      html: `
        <h2>CheckYourWrite - Email Doğrulaması</h2>
        <p>Doğrulama kodunuz: <strong>${code}</strong></p>
        <p>Kod 10 dakika içinde geçersiz olacaktır.</p>
        <p>Hesabını oluşturmadıysanız bu emaili yoksay.</p>
      `
    });
    
    res.json({ success: true, message: 'Kod gönderildi' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server hatası' });
  }
});

// POST /api/auth/verify-code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    // Kod kontrol et
    if (user.verification_token !== code) {
      return res.json({ success: false, message: 'Kod yanlış' });
    }
    
    // Expiry kontrol et
    if (new Date() > user.verification_token_expires) {
      return res.json({ success: false, message: 'Kod süresi doldu' });
    }
    
    // Verify et
    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    user.last_login = new Date();
    await user.save();
    
    // JWT token oluştur
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({ success: true, token, message: 'Doğrulama başarılı' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server hatası' });
  }
});

module.exports = router;
