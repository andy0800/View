# 🧪 NEXT Button Logic Test Suite

This comprehensive test suite validates the NEXT button logic and video completion flow across the entire system.

## 📋 Test Overview

The test suite consists of 4 main test scripts that cover different aspects of the NEXT button functionality:

### 1. **Next Button Logic Test** (`test-next-button-logic.js`)
- **Purpose**: Tests database schema, budget calculations, and numeric overflow prevention
- **What it tests**:
  - Ad availability and budget validation
  - Database schema for numeric overflow prevention
  - Corrupted budget value detection
  - Video completion flow simulation
  - Numeric constraints validation
  - KWD conversion accuracy
  - Database update operations
  - Recent view events tracking

### 2. **Frontend State Flow Test** (`test-frontend-state-flow.js`)
- **Purpose**: Tests viewer authentication, view events, and reward processing simulation
- **What it tests**:
  - Viewer authentication and session management
  - Recent view events for viewers
  - Available ads for viewers
  - Video start simulation
  - Video completion simulation
  - Reward processing capability
  - State management and cleanup

### 3. **API Endpoints Test** (`test-api-endpoints.js`)
- **Purpose**: Tests backend server status, API endpoints, and response formats
- **What it tests**:
  - Backend server accessibility
  - Sections API functionality
  - Section videos API functionality
  - Database query validation
  - Budget calculations
  - Fraud detection tracking
  - API response format validation

### 4. **Complete Flow Test** (`test-complete-next-button-flow.js`)
- **Purpose**: Tests the complete end-to-end flow from video start to NEXT button completion
- **What it tests**:
  - Environment readiness
  - Database schema validation
  - Numeric field precision
  - Test data availability
  - Complete video flow simulation
  - Reward processing simulation
  - State verification
  - Data cleanup and reversion

## 🚀 Running the Tests

### Prerequisites
1. **Backend server must be running** on port 5000
2. **Database must be accessible** and contain test data
3. **Node.js** must be installed
4. **All dependencies** must be installed (`npm install`)

### Quick Start
```bash
# Run all tests at once
node run-all-tests.js

# Run individual tests
node test-next-button-logic.js
node test-frontend-state-flow.js
node test-api-endpoints.js
node test-complete-next-button-flow.js
```

### Test Runner Features
The `run-all-tests.js` script provides:
- **Sequential execution** of all tests
- **Automatic timeout** (60 seconds per test)
- **Comprehensive reporting** with pass/fail status
- **Duration tracking** for performance monitoring
- **Error details** for failed tests
- **Summary report** with success rate

## 📊 Expected Results

### ✅ All Tests Should Pass If:
- Database schema is correct (numeric overflow prevention in place)
- Backend server is running and accessible
- Test data exists (viewers, ads, packages with budget)
- API endpoints are working correctly
- NEXT button logic is properly implemented
- No automatic video transitions occur
- Reward processing works on NEXT button click

### ❌ Common Failure Points:
- **Database connection issues**: Check database credentials and connection
- **Missing test data**: Ensure viewers and ads exist in the database
- **Backend server not running**: Start the backend server on port 5000
- **Schema mismatches**: Run database migrations if needed
- **API authentication issues**: Check if endpoints require authentication

## 🔍 Debugging Failed Tests

### 1. Check Database Connection
```bash
# Test database connectivity
node -e "
const { sequelize } = require('./src/models');
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database error:', err.message))
  .finally(() => process.exit());
"
```

### 2. Check Backend Server
```bash
# Test if backend is accessible
curl http://localhost:5000/api/health
```

### 3. Check Test Data
```bash
# Verify test data exists
node -e "
const { sequelize } = require('./src/models');
sequelize.query('SELECT COUNT(*) as count FROM users WHERE role = \\'viewer\\'')
  .then(([results]) => console.log('Viewers:', results[0].count))
  .catch(err => console.log('Error:', err.message))
  .finally(() => process.exit());
"
```

## 📈 Test Output Interpretation

### Success Indicators
- ✅ **All tests pass** with detailed output
- 📊 **Comprehensive data validation** showing correct values
- 🔄 **State transitions** working as expected
- 💰 **Budget calculations** accurate and within limits
- 🎬 **Video flow simulation** completing successfully

### Warning Indicators
- ⚠️ **Some tests fail** but others pass
- 📊 **Partial data validation** with some issues
- 🔄 **State transitions** working but with warnings
- 💰 **Budget calculations** working but with edge cases

### Error Indicators
- ❌ **Multiple tests fail** consistently
- 📊 **Data validation errors** indicating schema issues
- 🔄 **State transition failures** indicating logic problems
- 💰 **Budget calculation errors** indicating numeric overflow

## 🎯 What These Tests Validate

### NEXT Button Logic
1. **No Automatic Video Transitions**: Videos must not advance without NEXT button click
2. **Reward Processing on NEXT Click**: Rewards are only processed when NEXT is clicked
3. **State Management**: Video completion state is properly managed
4. **Budget Deduction**: Package budgets are correctly updated during reward processing

### Video Completion Flow
1. **Video Start**: View events are properly created
2. **Video Progress**: Progress tracking works correctly
3. **Video End**: Completion detection without auto-advancement
4. **NEXT Button**: Only enabled after video completion
5. **Reward Processing**: Backend calls work correctly
6. **Video Advancement**: Only happens after NEXT button click

### Database Integrity
1. **Numeric Overflow Prevention**: Large values don't cause database errors
2. **Budget Accuracy**: Calculations remain precise
3. **State Consistency**: Database state matches application state
4. **Transaction Safety**: Updates are atomic and safe

## 🔧 Customizing Tests

### Adding New Tests
1. Create a new test file following the naming convention
2. Include proper error handling and cleanup
3. Add the test to `run-all-tests.js`
4. Ensure the test is self-contained and doesn't affect other tests

### Modifying Test Data
- Tests use existing database data
- No permanent changes are made to the database
- All test data is cleaned up after testing
- Tests can be run multiple times safely

### Environment Variables
Tests use the default database configuration from `./src/models`. To use different configurations:
```bash
# Set environment variables before running tests
export DATABASE_URL="your_database_url"
export NODE_ENV="test"
node run-all-tests.js
```

## 📞 Support

If tests continue to fail:
1. **Check the console output** for specific error messages
2. **Verify database schema** matches expected structure
3. **Ensure backend server** is running and accessible
4. **Review test data** exists and is properly formatted
5. **Check for recent changes** that might affect the tested functionality

---

**Note**: These tests are designed to validate the NEXT button logic implementation. They simulate the complete user experience and ensure that the system behaves correctly according to the specified requirements.
