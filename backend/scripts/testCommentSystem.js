// backend/scripts/testCommentSystem.js
const { Comment, User, CommentLike, Ad } = require('../src/models');

async function testCommentSystem() {
  console.log('🔍 TESTING COMMENT SYSTEM\n');
  
  try {
    // Test 1: Check if models are loaded
    console.log('1️⃣ Checking models...');
    console.log('   - Comment model:', Comment ? '✅ Loaded' : '❌ Not loaded');
    console.log('   - User model:', User ? '✅ Loaded' : '❌ Not loaded');
    console.log('   - CommentLike model:', CommentLike ? '✅ Loaded' : '❌ Not loaded');
    console.log('   - Ad model:', Ad ? '✅ Loaded' : '❌ Not loaded');
    
    // Test 2: Check database connectivity
    console.log('\n2️⃣ Testing database connectivity...');
    try {
      await Comment.sequelize.authenticate();
      console.log('   ✅ Database connection successful');
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return;
    }
    
    // Test 3: Check if comment tables exist
    console.log('\n3️⃣ Checking comment tables...');
    try {
      const commentCount = await Comment.count();
      console.log(`   ✅ Comments table exists with ${commentCount} records`);
    } catch (error) {
      console.log('   ❌ Comments table error:', error.message);
    }
    
    try {
      const likeCount = await CommentLike.count();
      console.log(`   ✅ Comment likes table exists with ${likeCount} records`);
    } catch (error) {
      console.log('   ❌ Comment likes table error:', error.message);
    }
    
    // Test 4: Check for existing ads and users
    console.log('\n4️⃣ Checking for test data...');
    try {
      const adCount = await Ad.count();
      console.log(`   ✅ Ads table has ${adCount} records`);
      
      if (adCount > 0) {
        const sampleAd = await Ad.findOne();
        console.log(`   📺 Sample ad: ${sampleAd.title} (ID: ${sampleAd.id})`);
      }
    } catch (error) {
      console.log('   ❌ Ads table error:', error.message);
    }
    
    try {
      const userCount = await User.count();
      console.log(`   ✅ Users table has ${userCount} records`);
      
      if (userCount > 0) {
        const sampleUser = await User.findOne();
        console.log(`   👤 Sample user: ${sampleUser.name} (ID: ${sampleUser.id}, Role: ${sampleUser.role})`);
      }
    } catch (error) {
      console.log('   ❌ Users table error:', error.message);
    }
    
    // Test 5: Check comment associations
    console.log('\n5️⃣ Testing comment associations...');
    try {
      const commentWithAssociations = await Comment.findOne({
        include: [
          { model: User, as: 'user' },
          { model: Ad, as: 'ad' }
        ]
      });
      
      if (commentWithAssociations) {
        console.log('   ✅ Comment associations working');
        console.log(`   📝 Comment: "${commentWithAssociations.content}"`);
        console.log(`   👤 User: ${commentWithAssociations.user?.name || 'Unknown'}`);
        console.log(`   📺 Ad: ${commentWithAssociations.ad?.title || 'Unknown'}`);
      } else {
        console.log('   ℹ️ No comments found to test associations');
      }
    } catch (error) {
      console.log('   ❌ Comment associations error:', error.message);
    }
    
    console.log('\n✅ Comment system test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testCommentSystem();
