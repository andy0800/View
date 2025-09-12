const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class MyFatoorahService {
  constructor() {
    this.baseURL = process.env.MYFATOORAH_BASE_URL || 'https://api.myfatoorah.com';
    this.apiKey = process.env.MYFATOORAH_API_KEY || 'fake_api_key_for_testing';
    this.currency = 'KWD';
    this.country = 'KW';
  }

  // Create payment session
  async createPaymentSession(paymentData) {
    const sessionId = uuidv4();
    const amount = Math.round(paymentData.amount * 1000); // Convert KWD to fils
    
    const payload = {
      InvoiceAmount: amount,
      CurrencyIso: this.currency,
      CustomerName: paymentData.customerName,
      CustomerEmail: paymentData.customerEmail,
      CustomerMobile: paymentData.customerMobile,
      CustomerReference: paymentData.userId,
      UserDefinedField: sessionId,
      CallBackUrl: `${process.env.FRONTEND_URL}/payment/callback`,
      ErrorUrl: `${process.env.FRONTEND_URL}/payment/error`,
      Language: 'en',
      DisplayCurrencyIso: this.currency,
      MobileCountryCode: '+965'
    };

    // Simulate API call for testing
    if (process.env.NODE_ENV === 'development' || process.env.PAYMENT_SIMULATION_ENABLED === 'true') {
      return this.simulatePaymentSession(payload, sessionId);
    }

    try {
      const response = await axios.post(`${this.baseURL}/v2/SendPayment`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        sessionId,
        paymentUrl: response.data.Data.InvoiceURL,
        invoiceId: response.data.Data.InvoiceId
      };
    } catch (error) {
      console.error('MyFatoorah API Error:', error.response?.data || error.message);
      throw new Error('Failed to create payment session');
    }
  }

  // Simulate payment for testing
  simulatePaymentSession(payload, sessionId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          sessionId,
          paymentUrl: `${process.env.FRONTEND_URL}/payment/simulate?session=${sessionId}`,
          invoiceId: `INV_${Date.now()}`,
          isSimulated: true
        });
      }, 1000);
    });
  }

  // Verify payment status
  async verifyPayment(invoiceId) {
    if (process.env.NODE_ENV === 'development' || process.env.PAYMENT_SIMULATION_ENABLED === 'true') {
      return this.simulatePaymentVerification(invoiceId);
    }

    try {
      const response = await axios.post(`${this.baseURL}/v2/GetPaymentStatus`, {
        Key: invoiceId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        status: response.data.Data.InvoiceStatus,
        amount: response.data.Data.InvoiceValue,
        currency: response.data.Data.Currency
      };
    } catch (error) {
      console.error('MyFatoorah Verification Error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  // Simulate payment verification for testing
  simulatePaymentVerification(invoiceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate configurable success rate for testing
        const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.8;
        const isSuccess = Math.random() < successRate;
        
        resolve({
          success: true,
          status: isSuccess ? 'Paid' : 'Failed',
          amount: 10000, // 10 KWD in fils
          currency: 'KWD',
          isSimulated: true
        });
      }, 2000);
    });
  }

  // Generate webhook signature for verification
  generateWebhookSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Simulate payment processing for testing
  async simulatePaymentProcessing(sessionId, amount) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.8;
        const isSuccess = Math.random() < successRate;
        
        resolve({
          success: isSuccess,
          status: isSuccess ? 'completed' : 'failed',
          amount: amount,
          currency: 'KWD',
          isSimulated: true
        });
      }, 3000);
    });
  }
}

module.exports = new MyFatoorahService();
