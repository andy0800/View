const Stripe = require('stripe');
const { Wallet, Transaction } = require('../models');
const { validateAndConvertToFils } = require('../utils/currencyUtils');
const myfatoorahService = require('../services/myfatoorahService');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// POST /api/payment/create-intent
async function createDepositIntent(req, res) {
  const { amountKWD } = req.body;
  
  // Validate and convert KWD to fils for Stripe
  const amountFils = validateAndConvertToFils(parseFloat(amountKWD));
  
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

// Create MYFATOORH payment session
async function createMyFatoorahSession(req, res) {
  try {
    const { amountKWD, customerName, customerEmail, customerMobile } = req.body;
    
    // Validate amount
    if (!amountKWD || amountKWD < 1) {
      return res.status(400).json({ 
        message: 'Minimum deposit amount is 1 KWD' 
      });
    }

    // Validate required fields
    if (!customerName || !customerEmail || !customerMobile) {
      return res.status(400).json({ 
        message: 'Customer details are required' 
      });
    }

    const paymentData = {
      amount: parseFloat(amountKWD),
      userId: req.user.id,
      customerName,
      customerEmail,
      customerMobile
    };

    const session = await myfatoorahService.createPaymentSession(paymentData);
    
    // Store pending transaction
    const amountMicro = Math.round(amountKWD * 1000000);
    await Transaction.create({
      user_id: req.user.id,
      type: 'deposit',
      amount_micro: amountMicro,
      transaction_category: 'deposit',
      status: 'pending',
      reference: `MyFatoorah deposit: ${amountKWD} KWD`,
      reference_id: session.sessionId,
      payment_gateway: 'myfatoorah',
      gateway_transaction_id: session.invoiceId,
      metadata: {
        session_id: session.sessionId,
        invoice_id: session.invoiceId,
        amount_kwd: amountKWD,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_mobile: customerMobile
      }
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      paymentUrl: session.paymentUrl,
      invoiceId: session.invoiceId,
      amount: amountKWD,
      currency: 'KWD'
    });

  } catch (error) {
    console.error('Error creating MyFatoorah session:', error);
    res.status(500).json({ message: 'Failed to create payment session' });
  }
}

// Handle MYFATOORH webhook
async function handleMyFatoorahWebhook(req, res) {
  try {
    const { InvoiceId, InvoiceStatus, InvoiceValue, Currency } = req.body;
    
    // Verify webhook signature (implement when real API is available)
    // const signature = req.headers['x-myfatoorah-signature'];
    // const expectedSignature = myfatoorahService.generateWebhookSignature(req.body, process.env.MYFATOORAH_WEBHOOK_SECRET);
    
    if (InvoiceStatus === 'Paid') {
      // Find the transaction
      const transaction = await Transaction.findOne({
        where: {
          reference_id: InvoiceId,
          status: 'pending'
        }
      });

      if (transaction) {
        // Get or create wallet
        let wallet = await Wallet.findByUserId(transaction.user_id);
        if (!wallet) {
          wallet = await Wallet.createForUser(transaction.user_id);
        }

        // Credit the wallet
        await wallet.addBalance(transaction.amount_micro);
        
        // Update transaction status
        await transaction.update({
          status: 'completed',
          processed_at: new Date(),
          metadata: {
            ...transaction.metadata,
            webhook_received: true,
            payment_status: InvoiceStatus,
            verified_amount: InvoiceValue
          }
        });

        console.log(`✅ Payment completed for user ${transaction.user_id}: ${transaction.amount_micro} micro units`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('MyFatoorah webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}

// Verify payment status manually
async function verifyPaymentStatus(req, res) {
  try {
    const { sessionId } = req.params;
    
    const transaction = await Transaction.findOne({
      where: { reference_id: sessionId }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const verification = await myfatoorahService.verifyPayment(transaction.metadata.invoice_id);
    
    if (verification.status === 'Paid' && transaction.status === 'pending') {
      // Process the payment
      let wallet = await Wallet.findByUserId(transaction.user_id);
      if (!wallet) {
        wallet = await Wallet.createForUser(transaction.user_id);
      }

      await wallet.addBalance(transaction.amount_micro);
      await transaction.update({
        status: 'completed',
        processed_at: new Date()
      });
    }

    res.json({
      success: true,
      status: transaction.status,
      amount: transaction.getAmountKWD(),
      currency: 'KWD'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment' });
  }
}

// Create package payment session
async function createPackagePaymentSession(req, res) {
  try {
    const { packageId, budget, customerName, customerEmail, customerMobile } = req.body;
    
    // Validate required fields
    if (!packageId || !budget || !customerName || !customerEmail || !customerMobile) {
      return res.status(400).json({ 
        message: 'Package ID, budget, and customer details are required' 
      });
    }

    // Validate budget
    if (budget < 300 || (budget - 300) % 100 !== 0) {
      return res.status(400).json({ 
        message: 'Budget must be at least 300 KWD and increment by 100 KWD' 
      });
    }

    // Get package details
    const { AdvertiserPackage } = require('../models');
    const packageData = await AdvertiserPackage.findByPk(packageId);
    
    if (!packageData) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const paymentData = {
      amount: parseFloat(budget),
      userId: req.user.id,
      customerName,
      customerEmail,
      customerMobile,
      packageId,
      packageName: packageData.name,
      packageDuration: packageData.duration,
      pricePerView: packageData.price_per_view || packageData.pricePerView
    };

    const session = await myfatoorahService.createPaymentSession(paymentData);
    
    // Store pending package purchase transaction
    const amountMicro = Math.round(budget * 1000000);
    await Transaction.create({
      user_id: req.user.id,
      type: 'package_purchase',
      amount_micro: amountMicro,
      transaction_category: 'package_purchase',
      status: 'pending',
      reference: `Package purchase: ${packageData.name} - ${budget} KWD`,
      reference_id: session.sessionId,
      payment_gateway: 'myfatoorah',
      gateway_transaction_id: session.invoiceId,
      metadata: {
        session_id: session.sessionId,
        invoice_id: session.invoiceId,
        amount_kwd: budget,
        package_id: packageId,
        package_name: packageData.name,
        package_duration: packageData.duration,
        price_per_view: packageData.price_per_view || packageData.pricePerView,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_mobile: customerMobile
      }
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      paymentUrl: session.paymentUrl,
      invoiceId: session.invoiceId,
      amount: budget,
      currency: 'KWD',
      package: {
        id: packageId,
        name: packageData.name,
        duration: packageData.duration,
        pricePerView: packageData.price_per_view || packageData.pricePerView
      }
    });

  } catch (error) {
    console.error('Error creating package payment session:', error);
    res.status(500).json({ message: 'Failed to create package payment session' });
  }
}

// Simulate payment for testing
async function simulatePayment(req, res) {
  try {
    const { sessionId, amount } = req.body;
    
    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { reference_id: sessionId }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Simulate payment processing
    const simulation = await myfatoorahService.simulatePaymentProcessing(sessionId, amount);
    
    if (simulation.success) {
      // Process the payment
      let wallet = await Wallet.findByUserId(transaction.user_id);
      if (!wallet) {
        wallet = await Wallet.createForUser(transaction.user_id);
      }

      await wallet.addBalance(transaction.amount_micro);
      await transaction.update({
        status: 'completed',
        processed_at: new Date(),
        metadata: {
          ...transaction.metadata,
          simulated: true,
          simulation_result: 'success'
        }
      });

      res.json({
        success: true,
        message: 'Payment simulated successfully',
        status: 'completed',
        amount: transaction.getAmountKWD(),
        currency: 'KWD'
      });
    } else {
      await transaction.update({
        status: 'failed',
        metadata: {
          ...transaction.metadata,
          simulated: true,
          simulation_result: 'failed'
        }
      });

      res.json({
        success: false,
        message: 'Payment simulation failed',
        status: 'failed'
      });
    }

  } catch (error) {
    console.error('Payment simulation error:', error);
    res.status(500).json({ message: 'Simulation failed' });
  }
}

module.exports = { 
  createDepositIntent, 
  handleWebhook,
  createMyFatoorahSession,
  handleMyFatoorahWebhook,
  verifyPaymentStatus,
  simulatePayment,
  createPackagePaymentSession
};