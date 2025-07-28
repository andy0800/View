const Stripe = require('stripe');
const { Wallet, Transaction } = require('../models');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// POST /api/payment/create-intent
async function createDepositIntent(req, res) {
  const { amountKD } = req.body;
  const amountFils = Math.round(amountKD * 1000);
  
  // Create PaymentIntent in KWD (smallest unit = fils)
  const intent = await stripe.paymentIntents.create({
    amount: amountFils,
    currency: 'KWD',
    metadata: { userId: req.user.id }
  });
  
  res.json({ clientSecret: intent.client_secret });
}

// POST /api/payment/webhook
// Use raw body; configured in server.js
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Only handle successful payments
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const userId = intent.metadata.userId;
    const amount = intent.amount; // in fils

    // Credit advertiser wallet
    await Wallet.increment('confirmed_points', {
      by: amount,
      where: { userId }
    });
    await Transaction.create({
      userId,
      type: 'deposit',
      amount_pts: amount,
      status: 'completed'
    });
  }

  res.json({ received: true });
}

module.exports = { createDepositIntent, handleWebhook };