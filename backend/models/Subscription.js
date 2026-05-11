const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripe_subscription_id: String,
  stripe_customer_id: String,
  plan: {
    type: String,
    enum: ['premium', 'pro'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due'],
    default: 'active'
  },
  current_period_start: Date,
  current_period_end: Date,
  cancel_at_period_end: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
