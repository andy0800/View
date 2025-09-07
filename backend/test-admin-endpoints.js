// Test script for Phase 4: Real-time Data Verification & Testing
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = 'http://localhost:4001';

// Test admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Admin endpoints to test
const ADMIN_ENDPOINTS = [
  { name: 'Verification Stats', path: '/api/admin/verification-stats' },
  { name: 'Users', path: '/api/admin/users' },
  { name: 'Videos', path: '/api/admin/videos' },
  { name: 'Transactions', path: '/api/admin/transactions' },
  { name: 'Withdrawals', path: '/api/admin/withdrawals' },
  { name: 'Appeals', path: '/api/admin/appeals' },
  { name: 'KYC Requests', path: '/api/admin/kyc' }
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    if (options.data) {
      const postData = JSON.stringify(options.data);
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function authenticateAsAdmin() {
  try {
    console.log('🔐 Authenticating as admin...');
    const response = await makeRequest(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      data: {
        username: process.env.ADMIN_USERNAME || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'ChangeMe123'
      }
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Admin authentication successful');
      return true;
    } else {
      console.log('❌ Admin authentication failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Admin authentication failed:', error.message);
    return false;
  }
}

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing ${endpoint.name} (${endpoint.path})...`);
    
    const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 10000
    });

    // Analyze response structure
    const data = response.data;
    console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
    
    if (data.success !== undefined) {
      console.log(`   📊 Standardized Response: ${data.success ? 'Yes' : 'No'}`);
      
      if (data.success && data.data) {
        // Check for statistics
        if (data.data.statistics) {
          console.log(`   📈 Statistics Available: Yes`);
          console.log(`   📊 Statistics Keys: ${Object.keys(data.data.statistics).join(', ')}`);
        }
        
        // Check for pagination
        if (data.data.pagination) {
          console.log(`   📄 Pagination Available: Yes`);
          console.log(`   📄 Total Records: ${data.data.pagination.total_records || 'N/A'}`);
        }
        
        // Check main data array/object
        const mainDataKey = Object.keys(data.data).find(key => 
          key !== 'statistics' && key !== 'pagination'
        );
        if (mainDataKey && Array.isArray(data.data[mainDataKey])) {
          console.log(`   🗃️  Data Records: ${data.data[mainDataKey].length}`);
        }
      }
    } else {
      console.log(`   ⚠️  Legacy Response Format`);
      if (Array.isArray(data)) {
        console.log(`   🗃️  Records: ${data.length}`);
      }
    }
    
    return {
      success: true,
      endpoint: endpoint.name,
      status: response.status,
      hasStandardizedResponse: data.success !== undefined,
      hasStatistics: !!(data.success && data.data?.statistics),
      hasPagination: !!(data.success && data.data?.pagination),
      recordCount: getRecordCount(data)
    };
    
      } catch (error) {
    console.log(`❌ ${endpoint.name} - Error: ${error.message}`);
    return {
      success: false,
      endpoint: endpoint.name,
      error: error.message
    };
  }
}

function getRecordCount(data) {
  if (data.success && data.data) {
    const mainDataKey = Object.keys(data.data).find(key => 
      key !== 'statistics' && key !== 'pagination'
    );
    if (mainDataKey && Array.isArray(data.data[mainDataKey])) {
      return data.data[mainDataKey].length;
    }
  } else if (Array.isArray(data)) {
    return data.length;
  }
  return 0;
}

async function testDataConsistency() {
  console.log('\n🔍 Testing Data Consistency...');
  
  try {
    // Test users endpoint for data consistency
    const usersResponse = await makeRequest(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (usersResponse.data.success && usersResponse.data.data.statistics) {
      const stats = usersResponse.data.data.statistics;
      const users = usersResponse.data.data.users;
      
      console.log(`   📊 Statistics say ${stats.total} total users`);
      console.log(`   🗃️  Actual data shows ${users.length} users`);
      
      if (stats.total === users.length) {
        console.log(`   ✅ User count consistency: PASS`);
      } else {
        console.log(`   ⚠️  User count consistency: MISMATCH`);
      }
      
      // Check role breakdown
      const actualViewers = users.filter(u => u.role === 'viewer').length;
      const actualAdvertisers = users.filter(u => u.role === 'advertiser').length;
      const actualAdmins = users.filter(u => u.role === 'admin').length;
      
      console.log(`   👥 Viewers: Stats(${stats.viewers}) vs Actual(${actualViewers})`);
      console.log(`   💼 Advertisers: Stats(${stats.advertisers}) vs Actual(${actualAdvertisers})`);
      console.log(`   🔐 Admins: Stats(${stats.admins}) vs Actual(${actualAdmins})`);
    }
    
  } catch (error) {
    console.log(`   ❌ Data consistency test failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting PHASE 4: Real-time Data Verification & Testing\n');
  console.log('='.repeat(60));
  
  // Step 1: Authenticate
  const authSuccess = await authenticateAsAdmin();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test all endpoints
  console.log('\n📡 Testing Admin API Endpoints...');
  const results = [];
  
  for (const endpoint of ADMIN_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Step 3: Test data consistency
  await testDataConsistency();
  
  // Step 4: Generate summary report
  console.log('\n📋 PHASE 4 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed Tests: ${failedTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎯 Standardized Response Analysis:');
    const standardized = successfulTests.filter(r => r.hasStandardizedResponse);
    const legacy = successfulTests.filter(r => !r.hasStandardizedResponse);
    
    console.log(`   📊 Standardized Responses: ${standardized.length}`);
    console.log(`   📜 Legacy Responses: ${legacy.length}`);
    
    const withStats = successfulTests.filter(r => r.hasStatistics);
    const withPagination = successfulTests.filter(r => r.hasPagination);
    
    console.log(`   📈 With Statistics: ${withStats.length}`);
    console.log(`   📄 With Pagination: ${withPagination.length}`);
  }
  
  if (failedTests.length > 0) {
    console.log('\n⚠️  Failed Endpoints:');
    failedTests.forEach(test => {
      console.log(`   ❌ ${test.endpoint}: ${test.error}`);
    });
  }
  
  console.log('\n🏁 PHASE 4 Testing Complete');
  
  return {
    total: results.length,
    successful: successfulTests.length,
    failed: failedTests.length,
    results
  };
}

// Run the tests
runAllTests().catch(console.error);
