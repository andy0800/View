import api from '../api';

class PaymentService {
  // Create payment session
  async createPaymentSession(paymentData) {
    try {
      const response = await api.post('/api/payment/myfatoorah/create-session', paymentData);
      return response.data;
    } catch (error) {
      console.error('Payment session creation failed:', error);
      throw error;
    }
  }

  // Create package payment session
  async createPackagePaymentSession(paymentData) {
    try {
      const response = await api.post('/api/payment/myfatoorah/create-package-session', paymentData);
      return response.data;
    } catch (error) {
      console.error('Package payment session creation failed:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPaymentStatus(sessionId) {
    try {
      const response = await api.get(`/api/payment/myfatoorah/verify/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  // Simulate payment for testing
  async simulatePayment(sessionId, amount) {
    try {
      const response = await api.post('/api/payment/myfatoorah/simulate', {
        sessionId,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Payment simulation failed:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(page = 1, limit = 20) {
    try {
      const response = await api.get('/api/wallet/transactions', {
        params: { page, limit, type: 'deposit' }
      });
      return response.data;
    } catch (error) {
      console.error('Payment history fetch failed:', error);
      throw error;
    }
  }

  // Format amount for display
  formatAmount(amount) {
    return parseFloat(amount).toFixed(3);
  }

  // Validate payment form
  validatePaymentForm(formData) {
    const errors = {};

    if (!formData.amount || parseFloat(formData.amount) < 1) {
      errors.amount = 'Minimum deposit amount is 1 KWD';
    }

    if (!formData.customerName || formData.customerName.trim().length < 2) {
      errors.customerName = 'Customer name is required (minimum 2 characters)';
    }

    if (!formData.customerEmail || !this.isValidEmail(formData.customerEmail)) {
      errors.customerEmail = 'Valid email address is required';
    }

    if (!formData.customerMobile || !this.isValidMobile(formData.customerMobile)) {
      errors.customerMobile = 'Valid mobile number is required (e.g., +96512345678)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Mobile validation (Kuwait format)
  isValidMobile(mobile) {
    const mobileRegex = /^(\+965|965|0)?[569]\d{7}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  }

  // Format mobile number
  formatMobileNumber(mobile) {
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.startsWith('965')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+965${cleaned.substring(1)}`;
    } else if (cleaned.length === 8) {
      return `+965${cleaned}`;
    }
    return mobile;
  }
}

export default new PaymentService();
