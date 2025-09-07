// pressure-test/test-utils.js
// Utilities for pressure testing

const axios = require('axios');
const { TEST_CONFIG, API_ENDPOINTS } = require('./test-config');

// Global counters for unique data
let globalPhoneCounter = 0;
let globalCivilIdCounter = 0;

class TestUtils {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now()
    };
    
    this.apiClient = axios.create({
      baseURL: API_ENDPOINTS.baseUrl,
      timeout: 10000,
      withCredentials: true, // Enable cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Store session tokens for each user
    this.sessionTokens = new Map();
  }

  // Reset global counters for new test runs
  resetGlobalCounter() {
    globalPhoneCounter = 0;
    globalCivilIdCounter = 0;
    this.log('🔄 Reset global counters to 0');
  }

  // Performance monitoring
  async measureRequest(apiCall) {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      this.metrics.requests++;
      this.metrics.responseTimes.push(responseTime);
      
      return { success: true, data: result, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.errors++;
      this.metrics.responseTimes.push(responseTime);
      
      return { 
        success: false, 
        error: error.message, 
        responseTime,
        status: error.response?.status
      };
    }
  }

  // Get performance metrics
  getMetrics() {
    const totalRequests = this.metrics.requests + this.metrics.errors;
    const errorRate = totalRequests > 0 ? this.metrics.errors / totalRequests : 0;
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
      : 0;
    const maxResponseTime = Math.max(...this.metrics.responseTimes, 0);
    const minResponseTime = Math.min(...this.metrics.responseTimes, Infinity);

    return {
      totalRequests,
      successfulRequests: this.metrics.requests,
      failedRequests: this.metrics.errors,
      errorRate: errorRate.toFixed(4),
      averageResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      testDuration: Date.now() - this.metrics.startTime
    };
  }

  // API wrapper methods
  async loginWithOtp(phone) {
    // For testing, we'll use the test OTP fallback
    const testOtp = '1234'; // This should work in development mode
    
    // First request OTP
    const otpRequest = await this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.auth.requestOtp, { phone })
    );
    
    if (!otpRequest.success) {
      return otpRequest;
    }
    
    // Then verify OTP
    const verifyResult = await this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.auth.verifyOtp, { phone, otp: testOtp })
    );
    
    // Extract the actual cookie value from set-cookie header
    if (verifyResult.success && verifyResult.data && verifyResult.data.headers && verifyResult.data.headers['set-cookie']) {
      const cookies = verifyResult.data.headers['set-cookie'];
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      
      if (tokenCookie) {
        // Extract the token value from the cookie string
        const tokenValue = tokenCookie.split(';')[0].replace('token=', '');
        this.sessionTokens.set(phone, tokenValue);
        this.log(`✅ Stored cookie token for ${phone}: ${tokenValue.substring(0, 20)}...`);
      } else {
        this.logError(`❌ No token cookie found in set-cookie headers for ${phone}`);
      }
    } else if (verifyResult.success && verifyResult.data && verifyResult.data.data && verifyResult.data.data.token) {
      // Fallback to JWT token if no cookie
      this.sessionTokens.set(phone, verifyResult.data.data.token);
      this.log(`✅ Stored JWT token for ${phone}: ${verifyResult.data.data.token.substring(0, 20)}...`);
    } else {
      this.logError(`❌ No token found in response for ${phone}:`, verifyResult.data);
    }
    
    return verifyResult;
  }

  async register(userData) {
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.auth.register, userData)
    );
  }

  // Helper methods for authenticated requests
  async getAuthenticatedRequest(phone) {
    const token = this.sessionTokens.get(phone);
    if (!token) {
      throw new Error(`No session token found for phone: ${phone}`);
    }
    
    return {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      withCredentials: true
    };
  }

  async getPackages(phone) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.get(API_ENDPOINTS.advertiser.packages, authConfig)
    );
  }

  async purchasePackage(phone, packageId, budget) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.advertiser.purchasePackage, 
        { packageId, budget },
        authConfig
      )
    );
  }

  async createAd(phone, adData) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    const formData = new FormData();
    Object.keys(adData).forEach(key => {
      formData.append(key, adData[key]);
    });

    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.advertiser.createAd, formData, {
        ...authConfig,
        headers: { 
          ...authConfig.headers,
          'Content-Type': 'multipart/form-data'
        }
      })
    );
  }

  async getAvailableAds(phone) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.get(API_ENDPOINTS.viewer.getAds, authConfig)
    );
  }

  async startWatchingAd(phone, adId) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.viewer.startWatching.replace(':adId', adId), 
        {},
        authConfig
      )
    );
  }

  async completeWatchingAd(phone, adId, proofToken) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.viewer.completeWatching.replace(':adId', adId), 
        { proofToken },
        authConfig
      )
    );
  }

  async getWalletBalance(phone) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.get(API_ENDPOINTS.wallet.getBalance, authConfig)
    );
  }

  async addCredit(phone, amount) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.wallet.addCredit, 
        { amount },
        authConfig
      )
    );
  }

  async approveAd(phone, adId) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.admin.approveAd.replace(':id', adId), 
        {},
        authConfig
      )
    );
  }

  async activateAd(phone, adId) {
    const authConfig = await this.getAuthenticatedRequest(phone);
    return this.measureRequest(() => 
      this.apiClient.post(API_ENDPOINTS.admin.activateAd.replace(':id', adId), 
        {},
        authConfig
      )
    );
  }

  // Utility functions
  generateTestEmail(prefix, index) {
    return `${prefix}${index}@pressure-test.com`;
  }

  generateTestPhone(index) {
    // Use index parameter for guaranteed uniqueness - this ensures no duplicates
    // Use 7 digits (0-9999999) for uniqueness, matching Kuwait phone format +965[569]XXXXXXX
    const uniqueNumber = index % 10000000; // 10 million range, more than enough for 10k users
    return `+9655${uniqueNumber.toString().padStart(7, '0')}`; // Use 5 prefix for Kuwait format
  }

  generateTestCivilId(index) {
    // Use index parameter for guaranteed uniqueness - this ensures no duplicates
    // Use 6 digits (0-999999) for uniqueness, ensuring exactly 12 digits total
    const uniqueNumber = index % 1000000; // 1 million range, more than enough for 10k users
    return `987${uniqueNumber.toString().padStart(6, '0')}000`; // 12-digit civil ID with index
  }

  generateTestName(prefix, index) {
    return `${prefix} User ${index}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  logError(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }
}

module.exports = TestUtils;
