const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    default: null // Email-only login başlangıçta
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  subscription_plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  stripe_customer_id: String,
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: String,
  verification_token_expires: Date,
  last_login: Date
});

// Password hash etme (eğer kurulursa)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
