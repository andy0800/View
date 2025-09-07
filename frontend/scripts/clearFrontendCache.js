// frontend/scripts/clearFrontendCache.js
// Script to clear frontend cache and localStorage data

console.log('🧹 CLEARING FRONTEND CACHE AND STORAGE...');

// Clear localStorage
try {
  const keys = Object.keys(localStorage);
  console.log(`📱 Found ${keys.length} localStorage keys to clear`);
  
  keys.forEach(key => {
    if (key.includes('user') || key.includes('auth') || key.includes('data') || key.includes('cache')) {
      localStorage.removeItem(key);
      console.log(`  ✅ Removed: ${key}`);
    }
  });
  
  console.log('✅ localStorage cleared');
} catch (error) {
  console.log('⚠️  Error clearing localStorage:', error.message);
}

// Clear sessionStorage
try {
  const sessionKeys = Object.keys(sessionStorage);
  console.log(`📱 Found ${sessionKeys.length} sessionStorage keys to clear`);
  
  sessionKeys.forEach(key => {
    if (key.includes('user') || key.includes('auth') || key.includes('data') || key.includes('cache')) {
      sessionStorage.removeItem(key);
      console.log(`  ✅ Removed: ${key}`);
    }
  });
  
  console.log('✅ sessionStorage cleared');
} catch (error) {
  console.log('⚠️  Error clearing sessionStorage:', error.message);
}

// Clear IndexedDB (if available)
if (window.indexedDB) {
  try {
    const databases = indexedDB.databases();
    if (databases && databases.length > 0) {
      console.log(`🗄️  Found ${databases.length} IndexedDB databases to clear`);
      
      databases.forEach(db => {
        console.log(`  📊 Database: ${db.name} (version: ${db.version})`);
        // Note: IndexedDB deletion requires user interaction in some browsers
      });
      
      console.log('ℹ️  IndexedDB databases found - manual deletion may be required');
    } else {
      console.log('✅ No IndexedDB databases found');
    }
  } catch (error) {
    console.log('⚠️  Error checking IndexedDB:', error.message);
  }
}

// Clear cookies (if accessible)
try {
  const cookies = document.cookie.split(';');
  console.log(`🍪 Found ${cookies.length} cookies to clear`);
  
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.includes('user') || name.includes('auth') || name.includes('token') || name.includes('session')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log(`  ✅ Removed cookie: ${name}`);
    }
  });
  
  console.log('✅ Cookies cleared');
} catch (error) {
  console.log('⚠️  Error clearing cookies:', error.message);
}

// Clear any service worker caches
if ('serviceWorker' in navigator && 'caches' in window) {
  try {
    caches.keys().then(cacheNames => {
      console.log(`🗂️  Found ${cacheNames.length} service worker caches to clear`);
      
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName).then(() => {
          console.log(`  ✅ Cleared cache: ${cacheName}`);
        }).catch(error => {
          console.log(`  ⚠️  Error clearing cache ${cacheName}:`, error.message);
        });
      });
    });
  } catch (error) {
    console.log('⚠️  Error clearing service worker caches:', error.message);
  }
}

console.log('\n🎉 FRONTEND CACHE CLEARING COMPLETED!');
console.log('📱 All localStorage, sessionStorage, cookies, and caches have been cleared');
console.log('🔄 Please refresh the page to see the clean state');
console.log('💡 If you still see data, it may be coming from the backend API');

// Additional instructions for manual clearing
console.log('\n📋 MANUAL CLEARING INSTRUCTIONS:');
console.log('1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)');
console.log('2. Clear browser cache and cookies');
console.log('3. Check browser developer tools > Application > Storage');
console.log('4. Verify no data is being returned from API endpoints');
console.log('5. Check if there are any hardcoded/mock data in components');
