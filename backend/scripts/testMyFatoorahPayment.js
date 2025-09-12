const { Transaction, Wallet, User } = require('../src/models');
const myfatoorahService = require('../src/services/myfatoorahService');

async function testMyFatoorahPayment() {
  try {
    console.log('🧪 Testing MYFATOORH Payment System...\n');

    // Find a test advertiser user
    const advertiser = await User.findOne({
      where: { role: 'advertiser' }
    });

    if (!advertiser) {
      console.log('❌ No advertiser found. Please create a test advertiser first.');
      return;
    }

    console.log(`👤 Testing with advertiser: ${advertiser.email} (${advertiser.id})`);

    // Test payment session creation
    console.log('\n1️⃣ Testing payment session creation...');
    const paymentData = {
      amount: 10, // 10 KWD
      userId: advertiser.id,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerMobile: '+96512345678'
    };

    const session = await myfatoorahService.createPaymentSession(paymentData);
    console.log('✅ Payment session created:', {
      sessionId: session.sessionId,
      invoiceId: session.invoiceId,
      isSimulated: session.isSimulated
    });

    // Test transaction creation
    console.log('\n2️⃣ Testing transaction creation...');
    const amountMicro = Math.round(10 * 1000000); // 10 KWD in micro units
    
    const transaction = await Transaction.create({
      user_id: advertiser.id,
      type: 'deposit',
      amount_micro: amountMicro,
      transaction_category: 'deposit',
      status: 'pending',
      reference: `MyFatoorah test deposit: 10 KWD`,
      reference_id: session.sessionId,
      payment_gateway: 'myfatoorah',
      gateway_transaction_id: session.invoiceId,
      metadata: {
        session_id: session.sessionId,
        invoice_id: session.invoiceId,
        amount_kwd: 10,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_mobile: '+96512345678',
        test: true
      }
    });

    console.log('✅ Transaction created:', {
      id: transaction.id,
      amount: transaction.getAmountKWD(),
      status: transaction.status,
      paymentGateway: transaction.payment_gateway
    });

    // Test payment simulation
    console.log('\n3️⃣ Testing payment simulation...');
    const simulation = await myfatoorahService.simulatePaymentProcessing(session.sessionId, 10);
    console.log('✅ Payment simulation result:', simulation);

    if (simulation.success) {
      // Process the payment
      let wallet = await Wallet.findByUserId(advertiser.id);
      if (!wallet) {
        wallet = await Wallet.createForUser(advertiser.id);
      }

      const balanceBefore = wallet.getBalanceKWD();
      await wallet.addBalance(transaction.amount_micro);
      const balanceAfter = wallet.getBalanceKWD();

      await transaction.update({
        status: 'completed',
        processed_at: new Date(),
        metadata: {
          ...transaction.metadata,
          simulated: true,
          simulation_result: 'success'
        }
      });

      console.log('✅ Payment processed successfully:');
      console.log(`   Balance before: ${balanceBefore} KWD`);
      console.log(`   Balance after: ${balanceAfter} KWD`);
      console.log(`   Amount added: ${transaction.getAmountKWD()} KWD`);
    } else {
      await transaction.update({
        status: 'failed',
        metadata: {
          ...transaction.metadata,
          simulated: true,
          simulation_result: 'failed'
        }
      });
      console.log('❌ Payment simulation failed');
    }

    // Test payment verification
    console.log('\n4️⃣ Testing payment verification...');
    const verification = await myfatoorahService.verifyPayment(session.invoiceId);
    console.log('✅ Payment verification result:', verification);

    // Display final wallet status
    console.log('\n5️⃣ Final wallet status...');
    const finalWallet = await Wallet.findByUserId(advertiser.id);
    console.log(`💰 Current balance: ${finalWallet.getBalanceKWD()} KWD`);
    console.log(`💰 Available balance: ${finalWallet.getAvailableBalanceKWD()} KWD`);

    // Display transaction history
    console.log('\n6️⃣ Recent transactions...');
    const recentTransactions = await Transaction.findAll({
      where: { user_id: advertiser.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    recentTransactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} - ${tx.getAmountKWD()} KWD - ${tx.status} (${tx.payment_gateway})`);
    });

    console.log('\n🎉 MYFATOORH Payment System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMyFatoorahPayment();
