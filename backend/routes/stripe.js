const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// POST /api/stripe/webhook
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook hatası:', error);
    return res.status(400).json({ error: 'Webhook signature doğrulaması başarısız' });
  }
  
  try {
    // Ödeme başarılı
    if (event.type === 'invoice.payment_succeeded') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Stripe customer info al
      const customer = await stripe.customers.retrieve(customerId);
      const userEmail = customer.email;
      
      // User subscription planını güncelle
      const user = await User.findOne({ email: userEmail });
      if (user) {
        user.subscription_plan = 'premium'; // Plan'ı belirle
        user.stripe_customer_id = customerId;
        await user.save();
        
        console.log(`✅ ${userEmail} Premium aboneye dönüştürüldü`);
      }
    }
    
    // Subscription iptal edildi
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      const customer = await stripe.customers.retrieve(customerId);
      const userEmail = customer.email;
      
      const user = await User.findOne({ email: userEmail });
      if (user) {
        user.subscription_plan = 'free';
        await user.save();
        
        console.log(`❌ ${userEmail} Free plana döndürüldü`);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook işleme hatası:', error);
    res.status(500).json({ error: 'Server hatası' });
  }
});

module.exports = router;
