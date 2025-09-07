// backend/src/scripts/cleanupSessions.js
const SessionService = require('../services/sessionService');

async function cleanupExpiredSessions() {
  try {
    console.log('🧹 Starting session cleanup...');
    const cleanedCount = await SessionService.cleanupExpiredSessions();
    console.log(`✅ Cleaned up ${cleanedCount} expired sessions`);
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupExpiredSessions().then(() => {
    console.log('✅ Session cleanup completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Session cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = cleanupExpiredSessions; 