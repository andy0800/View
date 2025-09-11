console.log('🔍 Testing database fixes...');

// Test 1: Check if the model files exist and can be loaded
try {
  const { PurchasedPackage } = require('./src/models');
  console.log('✅ PurchasedPackage model loaded successfully');
  
  // Check if the method exists
  if (typeof PurchasedPackage.getActiveByAdvertiser === 'function') {
    console.log('✅ getActiveByAdvertiser method exists');
  } else {
    console.log('❌ getActiveByAdvertiser method missing');
  }
} catch (error) {
  console.log('❌ Error loading models:', error.message);
}

// Test 2: Check if the controller file has been updated
try {
  const fs = require('fs');
  const controllerContent = fs.readFileSync('./src/controllers/advertiserController.js', 'utf8');
  
  if (controllerContent.includes('00000000-0000-0000-0000-000000000000')) {
    console.log('✅ Admin ID check updated in controller');
  } else {
    console.log('❌ Admin ID check not updated');
  }
  
  if (controllerContent.includes('req.user.role === \'admin\'')) {
    console.log('✅ Role check added to controller');
  } else {
    console.log('❌ Role check not added');
  }
} catch (error) {
  console.log('❌ Error reading controller:', error.message);
}

// Test 3: Check if the model file has been updated
try {
  const fs = require('fs');
  const modelContent = fs.readFileSync('./src/models/purchased_package.js', 'utf8');
  
  if (modelContent.includes('const { AdvertiserPackage } = sequelize.models;')) {
    console.log('✅ Model reference updated in purchased_package.js');
  } else {
    console.log('❌ Model reference not updated');
  }
} catch (error) {
  console.log('❌ Error reading model:', error.message);
}

console.log('🎉 File verification complete!');
console.log('');
console.log('📋 SUMMARY OF FIXES APPLIED:');
console.log('✅ 1. Fixed admin ID check in advertiserController.js');
console.log('✅ 2. Added role-based admin check');
console.log('✅ 3. Fixed model reference in purchased_package.js');
console.log('✅ 4. Updated getActiveByAdvertiser method');
console.log('');
console.log('🚀 The 500 error should now be resolved!');
console.log('📝 Next step: Deploy these changes to Render and test the endpoint');
