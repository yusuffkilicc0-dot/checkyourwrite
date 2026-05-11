const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Correction = require('../models/Correction');
const authMiddleware = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password_hash');
    
    if (!user) {
      return res.json({ success: false, message: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server hatası' });
  }
});

// GET /api/user/corrections
router.get('/corrections', authMiddleware, async (req, res) => {
  try {
    const corrections = await Correction.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .limit(50);
    
    res.json({ success: true, corrections });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server hatası' });
  }
});

// POST /api/user/save-correction
router.post('/save-correction', authMiddleware, async (req, res) => {
  try {
    const { original_text, corrected_text, mistakes } = req.body;
    
    const correction = new Correction({
      user_id: req.userId,
      original_text,
      corrected_text,
      mistakes
    });
    
    await correction.save();
    res.json({ success: true, correction });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Server hatası' });
  }
});

module.exports = router;
