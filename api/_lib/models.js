import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  subscription_plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free',
  },
  stripe_customer_id: String,
  is_verified: {
    type: Boolean,
    default: false,
  },
  verification_token: String,
  verification_token_expires: Date,
  last_login: Date,
  // Sunucu tarafli gunluk kullanim takibi (free plan limiti icin)
  usage_date: String, // 'YYYY-MM-DD'
  usage_count: {
    type: Number,
    default: 0,
  },
});

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stripe_subscription_id: String,
  stripe_customer_id: String,
  plan: {
    type: String,
    enum: ['premium', 'pro'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due'],
    default: 'active',
  },
  current_period_start: Date,
  current_period_end: Date,
  cancel_at_period_end: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const correctionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  original_text: {
    type: String,
    required: true,
  },
  corrected_text: {
    type: String,
    required: true,
  },
  mistakes: [
    {
      original: String,
      suggested: String,
      rule: String,
      position: Number,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  language: {
    type: String,
    default: 'de',
  },
});

const oralSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: String,        // 'full' | 'praesentation' | 'rueckfragen' | 'diskussion' | 'warmup'
  mode_label: String,  // görünen ad
  topic: String,       // konu kategorisi
  ai_score: Number,    // AI genel puanı (0-100)
  ai_label: String,    // Almanca etiket
  ai_summary: String,  // Türkçe kısa özet
  ai_criteria: [       // 5 telc kriteri
    {
      name: String,
      score: Number,
    },
  ],
  self_ratings: {      // öz-değerlendirme (1-5)
    aussprache: Number,
    wortschatz: Number,
    grammatik: Number,
    aufbau: Number,
    interaktion: Number,
  },
  notes: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Vercel serverless function'lar aynı process'i yeniden kullanabildiği için
// "OverwriteModelError" almamak adına model zaten tanımlıysa onu kullanıyoruz.
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Subscription =
  mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
export const Correction =
  mongoose.models.Correction || mongoose.model('Correction', correctionSchema);
export const OralSession =
  mongoose.models.OralSession || mongoose.model('OralSession', oralSessionSchema);
