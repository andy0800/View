# 🔄 24-HOUR RECURRING REWARD SYSTEM

## 📋 Overview

This implementation changes the ad reward system from **one-time lifetime rewards** to **recurring 24-hour rewards**, allowing users to earn credits for watching the same ad once every 24 hours.

---

## 🎯 What Changed

### **Before:**
- ✅ User watches ad → Earns reward **once forever**
- ❌ Ad becomes permanently "unrewardable" 
- ❌ User can never earn from that ad again

### **After:**
- ✅ User watches ad → Earns reward **once per 24 hours**
- ✅ After 24 hours → Ad becomes "rewardable" again
- ✅ User can return daily to earn rewards
- ✅ Every rewarded view counts for advertiser analytics

---

## 📁 Files Modified

### **1. Database Changes**
**File:** `backend/add-24hr-reward-system.sql`
- ✅ Added performance indexes for 24-hour lookups
- ✅ Index: `idx_view_events_24hr_reward_check` - Fast user+ad+time queries
- ✅ Index: `idx_view_events_user_completed_at` - User watch history optimization
- ✅ Index: `idx_view_events_ad_completed` - Ad-specific view tracking
- ✅ Updated missing `completed_at` timestamps for existing records

### **2. Model Layer**
**File:** `backend/src/models/view_event.js`

**New Methods:**
```javascript
// Find most recent completed view for user+ad
ViewEvent.findLastCompletedViewByUserAndAd(userId, adId)

// Check if 24 hours have passed since last reward
ViewEvent.canUserGetRewardedAgain(userId, adId)
// Returns: { canReward, reason, hoursSinceLastView, hoursRemaining, nextRewardAvailableAt }
```

### **3. Controller Layer**
**File:** `backend/src/controllers/viewerController.js`

**Modified Functions:**

#### A) `getSectionVideos()` (Lines 117-129)
**Change:** Query only views from last 24 hours
```javascript
// OLD: All completed views (lifetime)
where: { user_id, is_completed: true }

// NEW: Only recent views (last 24 hours)
where: { 
  user_id, 
  is_completed: true,
  completed_at: { [Op.gte]: twentyFourHoursAgo }
}
```

#### B) `getAllAds()` (Lines 556-569)
**Change:** Same 24-hour window for "All Ads" tab
```javascript
// Only mark ads as "watched" if viewed in last 24 hours
completed_at: { [Op.gte]: twentyFourHoursAgo }
```

#### C) `startWatchingAd()` (Lines 246-262)
**Change:** Added 24-hour cooldown check
```javascript
// Check if user can get rewarded again
const rewardEligibility = await ViewEvent.canUserGetRewardedAgain(userId, adId);

if (!rewardEligibility.canReward) {
  // Block reward creation if < 24 hours passed
  return res.status(400).json({ 
    message: 'You must wait 24 hours...',
    cooldownInfo: { hoursRemaining, nextRewardAvailableAt }
  });
}
```

---

## 🔧 Deployment Instructions

### **Step 1: Backup Database** ⚠️
```bash
# IMPORTANT: Always backup before making changes!
pg_dump -h <DB_HOST> -U <DB_USER> -d <DB_NAME> > backup_before_24hr_system.sql
```

### **Step 2: Execute Database Changes**

#### **Windows (PowerShell):**
```powershell
cd backend
.\execute-24hr-reward-system.ps1
```

#### **Linux/Mac (Bash):**
```bash
cd backend
chmod +x execute-24hr-reward-system.sh
./execute-24hr-reward-system.sh
```

#### **Manual Execution:**
```bash
# Using environment variables from .env
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f add-24hr-reward-system.sql

# Or with direct connection string
psql "postgresql://USER:PASS@HOST:PORT/DATABASE?sslmode=require" -f add-24hr-reward-system.sql
```

### **Step 3: Deploy Code Changes**
```bash
# The modified files are already in place:
# ✅ backend/src/models/view_event.js
# ✅ backend/src/controllers/viewerController.js

# No additional code deployment needed - files are already updated!
```

### **Step 4: Restart Backend Server**
```bash
cd backend
npm start
```

### **Step 5: Verify Deployment**
Test the following scenarios:

1. **First-time view:** User should earn reward ✅
2. **Immediate re-watch:** User should see "0.000 KWD" (cooldown active) ✅
3. **After 24 hours:** User should see full reward amount again ✅
4. **Second reward:** User should earn reward successfully ✅

---

## 🔍 How It Works

### **1. User Opens App**
```javascript
// Backend calculates is_watched flag
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentViews = await ViewEvent.findAll({
  where: { 
    user_id, 
    is_completed: true,
    completed_at: { [Op.gte]: twentyFourHoursAgo }
  }
});

// Ad returned with is_watched flag
{
  id: "ad-123",
  title: "Business Ad",
  is_watched: false, // ✅ Eligible for reward (>24hrs or never watched)
  package: {
    viewer_reward: 0.005
  }
}
```

### **2. User Starts Watching**
```javascript
// Frontend calls: POST /viewer/ads/:adId/start
// Backend checks eligibility:
const eligibility = await ViewEvent.canUserGetRewardedAgain(userId, adId);

if (eligibility.canReward) {
  // ✅ Create new view event with proof token
  const viewEvent = await ViewEvent.create({
    user_id, ad_id, proof_token, ...
  });
} else {
  // ❌ Block: "Must wait 24 hours"
  return { error: 'cooldown_active', hoursRemaining: 12.5 };
}
```

### **3. User Completes View**
```javascript
// Frontend calls: POST /viewer/ads/complete
// Backend processes reward:
await viewEvent.update({
  is_completed: true,
  completed_at: new Date(), // ⏰ Timestamp for 24hr tracking
  viewer_reward_micro: 5000 // 0.005 KWD in micro-units
});

// Add to user wallet
await wallet.addBalance(5000);

// ✅ User earned reward!
// ⏰ Next reward available in 24 hours
```

### **4. User Returns Next Day**
```javascript
// 24+ hours later:
const lastView = await ViewEvent.findLastCompletedViewByUserAndAd(userId, adId);
const hoursSince = (Date.now() - lastView.completed_at) / (1000 * 60 * 60);

if (hoursSince >= 24) {
  // ✅ Cooldown expired!
  // Ad shows full reward amount again
  // User can earn reward again
}
```

---

## 📊 Database Schema

### **view_events table** (existing, no changes to columns)
```sql
CREATE TABLE view_events (
  id UUID PRIMARY KEY,
  ad_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,  -- ⏰ Used for 24hr tracking
  viewer_reward_micro BIGINT,
  -- ... other columns
);
```

### **New Indexes** (added for performance)
```sql
-- Fast 24-hour eligibility checks
CREATE INDEX idx_view_events_24hr_reward_check 
ON view_events (user_id, ad_id, is_completed, completed_at DESC)
WHERE is_completed = true;

-- User watch history optimization
CREATE INDEX idx_view_events_user_completed_at 
ON view_events (user_id, completed_at DESC)
WHERE is_completed = true;

-- Ad-specific view tracking
CREATE INDEX idx_view_events_ad_completed 
ON view_events (ad_id, is_completed, completed_at DESC);
```

---

## ✅ Safety Features

### **1. Backward Compatibility**
- ✅ All existing view events remain valid
- ✅ No data loss or corruption
- ✅ Existing transactions unchanged
- ✅ Old app versions will continue working

### **2. Fraud Prevention**
- ✅ Proof token system still active
- ✅ Minimum watch duration (95%) enforced
- ✅ Token expiration (5 minutes)
- ✅ Duplicate view detection

### **3. Performance Optimization**
- ✅ Indexes added for fast queries
- ✅ No full table scans
- ✅ Efficient time-based filtering

### **4. Advertiser Protection**
- ✅ Every rewarded view counts for advertiser
- ✅ Budget deduction accurate
- ✅ View analytics updated correctly
- ✅ No fake views or exploitation

---

## 🧪 Testing Checklist

### **Manual Testing:**
- [ ] User watches new ad → Gets reward ✅
- [ ] User immediately re-watches → Shows "0.000 KWD" ✅
- [ ] Frontend still plays video (no blocking) ✅
- [ ] After 24 hours → Ad shows full reward ✅
- [ ] User watches again → Gets reward ✅
- [ ] Advertiser sees both views in analytics ✅
- [ ] Multiple users can watch same ad ✅
- [ ] Different ads have independent cooldowns ✅

### **API Testing:**
```bash
# 1. Get section videos
curl -X GET "http://localhost:4000/viewer/section/retail/videos" \
  -H "Authorization: Bearer <token>"
# Response should show is_watched based on 24hr window

# 2. Start watching
curl -X POST "http://localhost:4000/viewer/ads/ad-123/start" \
  -H "Authorization: Bearer <token>"
# Should return proof token if eligible

# 3. Try immediate re-watch (should fail)
curl -X POST "http://localhost:4000/viewer/ads/ad-123/start" \
  -H "Authorization: Bearer <token>"
# Should return: "Must wait 24 hours" error
```

### **Database Testing:**
```sql
-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'view_events';

-- Test 24hr query performance
EXPLAIN ANALYZE
SELECT ad_id FROM view_events
WHERE user_id = 'test-user-id'
  AND is_completed = true
  AND completed_at >= NOW() - INTERVAL '24 hours';

-- Verify all completed views have timestamps
SELECT COUNT(*) 
FROM view_events 
WHERE is_completed = true 
  AND completed_at IS NULL;
-- Should return: 0
```

---

## 🐛 Troubleshooting

### **Issue: "Cannot read property 'completed_at' of null"**
**Solution:** Some old view events might be missing `completed_at` timestamp
```sql
-- Fix missing timestamps
UPDATE view_events 
SET completed_at = viewed_at 
WHERE is_completed = true 
  AND completed_at IS NULL;
```

### **Issue: Users can't watch any ads**
**Solution:** Check if 24hr queries are working
```sql
-- Test query
SELECT * FROM view_events
WHERE user_id = '<test-user-id>'
  AND completed_at >= NOW() - INTERVAL '24 hours'
ORDER BY completed_at DESC;
```

### **Issue: Ads still show as "watched" after 24 hours**
**Solution:** Clear server cache or restart
```bash
# Restart backend
cd backend
npm start
```

### **Issue: Database query is slow**
**Solution:** Verify indexes exist
```sql
-- Check indexes
\di view_events*

-- If missing, run the SQL script again
\i add-24hr-reward-system.sql
```

---

## 📈 Monitoring

### **Key Metrics to Track:**
1. **Daily Active Users** - Should increase with recurring rewards
2. **Avg Views per User** - Should increase as users return
3. **Advertiser View Counts** - Should show accurate recurring views
4. **Wallet Transactions** - Monitor for unusual patterns

### **Database Queries:**
```sql
-- Daily recurring views (users watching same ad multiple times)
SELECT 
  ad_id,
  user_id,
  COUNT(*) as view_count,
  MIN(completed_at) as first_view,
  MAX(completed_at) as last_view
FROM view_events
WHERE is_completed = true
GROUP BY ad_id, user_id
HAVING COUNT(*) > 1;

-- Reward distribution over time
SELECT 
  DATE(completed_at) as date,
  COUNT(*) as total_views,
  SUM(viewer_reward_micro) / 1000000.0 as total_rewards_kwd
FROM view_events
WHERE is_completed = true
GROUP BY DATE(completed_at)
ORDER BY date DESC
LIMIT 30;
```

---

## 🎉 Success Criteria

✅ **Users can earn rewards every 24 hours for the same ad**  
✅ **Frontend automatically shows correct reward amounts**  
✅ **No breaking changes to existing functionality**  
✅ **All advertiser analytics remain accurate**  
✅ **Database performance remains optimal**  
✅ **Fraud prevention systems still active**  

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review server logs: `backend/logs/`
3. Test with the provided API examples
4. Verify database indexes are created

---

## 📅 Rollback Plan

If you need to revert changes:

### **1. Rollback Code:**
```bash
git revert <commit-hash>
```

### **2. Remove Indexes (Optional):**
```sql
DROP INDEX IF EXISTS idx_view_events_24hr_reward_check;
DROP INDEX IF EXISTS idx_view_events_user_completed_at;
DROP INDEX IF EXISTS idx_view_events_ad_completed;
```
**Note:** Keeping indexes won't hurt, they'll just be unused.

### **3. Restore from Backup:**
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_before_24hr_system.sql
```

---

## ✨ Benefits

### **For Users:**
- 🎉 More earning opportunities
- 💰 Can return daily for rewards
- 📱 Better engagement and retention

### **For Advertisers:**
- 📊 More views over time
- 🎯 Better brand recall (recurring exposure)
- 💡 Accurate multi-view analytics

### **For Platform:**
- 📈 Increased daily active users
- ⏰ Higher session frequency
- 💵 More advertiser value

---

**Implementation Date:** 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Production

