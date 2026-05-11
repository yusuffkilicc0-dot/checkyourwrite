const mongoose = require('mongoose');

const correctionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  original_text: {
    type: String,
    required: true
  },
  corrected_text: {
    type: String,
    required: true
  },
  mistakes: [{
    original: String,
    suggested: String,
    rule: String,
    position: Number
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    default: 'de' // German
  }
});

module.exports = mongoose.model('Correction', correctionSchema);
