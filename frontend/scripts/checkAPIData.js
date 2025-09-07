// frontend/scripts/checkAPIData.js
// Script to check what data the frontend is receiving from API calls

import api from '../api';

console.log('🔍 CHECKING API DATA SOURCES...');

// Test all major API endpoints to see what data is returned
const endpoints = [
  '/api/admin/verification-stats',
  '/api/admin/users',
  '/api/admin/videos',
  '/api/admin/transactions',
  '/api/admin/withdrawals',
  '/api/admin/appeals',
  '/advertiser/dashboard',
  '/advertiser/ads',
  '/advertiser/profile',
  '/advertiser/credit',
  '/advertiser/packages',
  '/viewer/feed',
  '/viewer/profile'
];

async function checkAllEndpoints() {
  console.log('📡 Testing all API endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Testing: ${endpoint}`);
      const response = await api.get(endpoint);
      
      if (response.data) {
        const data = response.data;
        const recordCount = Array.isArray(data) ? data.length : 
                           (data.users ? data.users.length : 
                           (data.ads ? data.ads.length : 
                           (data.transactions ? data.transactions.length : 
                           (data.withdrawals ? data.withdrawals.length : 
                           (data.appeals ? data.appeals.length : 
                           (data.packages ? data.packages.length : 0))))));
        
        if (recordCount > 0) {
          console.log(`  ❌ DATA FOUND: ${recordCount} records`);
          console.log(`     Sample data:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } else {
          console.log(`  ✅ No data returned`);
        }
      } else {
        console.log(`  ✅ No response data`);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log(`  🔒 Unauthorized (expected for admin endpoints)`);
        } else if (error.response.status === 404) {
          console.log(`  ❌ Endpoint not found`);
        } else {
          console.log(`  ⚠️  Error ${error.response.status}: ${error.response.data?.message || error.message}`);
        }
      } else {
        console.log(`  ❌ Network error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 API CHECK COMPLETED');
  console.log('💡 If you see data above, it means the backend is still returning data');
  console.log('💡 If no data is shown, the issue might be in the frontend components');
}

// Check localStorage and sessionStorage for cached data
function checkLocalStorage() {
  console.log('\n📱 CHECKING LOCAL STORAGE...');
  
  const localStorageKeys = Object.keys(localStorage);
  const sessionStorageKeys = Object.keys(sessionStorage);
  
  if (localStorageKeys.length > 0) {
    console.log('📦 localStorage keys found:');
    localStorageKeys.forEach(key => {
      if (key.includes('user') || key.includes('auth') || key.includes('data')) {
        const value = localStorage.getItem(key);
        console.log(`  - ${key}: ${value.substring(0, 100)}...`);
      }
    });
  } else {
    console.log('✅ localStorage is empty');
  }
  
  if (sessionStorageKeys.length > 0) {
    console.log('📦 sessionStorage keys found:');
    sessionStorageKeys.forEach(key => {
      if (key.includes('user') || key.includes('auth') || key.includes('data')) {
        const value = sessionStorage.getItem(key);
        console.log(`  - ${key}: ${value.substring(0, 100)}...`);
      }
    });
  } else {
    console.log('✅ sessionStorage is empty');
  }
}

// Check for any hardcoded data in components
function checkComponentData() {
  console.log('\n🔍 CHECKING COMPONENT DATA SOURCES...');
  
  // This would need to be run in the browser context
  console.log('💡 To check component data sources:');
  console.log('   1. Open browser developer tools');
  console.log('   2. Go to Console tab');
  console.log('   3. Check for any console.log outputs');
  console.log('   4. Look for hardcoded arrays or objects');
  console.log('   5. Check React DevTools for component state');
}

// Run all checks
async function runAllChecks() {
  try {
    await checkAllEndpoints();
    checkLocalStorage();
    checkComponentData();
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('📋 Next steps:');
    console.log('   1. If API returns data: Database not fully wiped');
    console.log('   2. If API returns no data: Check frontend components');
    console.log('   3. If localStorage has data: Clear browser storage');
    console.log('   4. Hard refresh the page (Ctrl+F5)');
    
  } catch (error) {
    console.error('❌ Error during API check:', error);
  }
}

// Run the checks
runAllChecks();
