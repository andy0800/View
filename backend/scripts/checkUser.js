// backend/scripts/checkUser.js
require('dotenv').config();
const { User } = require('../src/models');

async function checkUser() {
  try {
    console.log('🔍 Checking user data...');
    
    const user = await User.findOne({
      where: { phone: '+96550000000' }
    });

    if (user) {
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   KYC Status: ${user.kyc_status}`);
      console.log(`   Company: ${user.company_name}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();
