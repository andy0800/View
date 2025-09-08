# 🚀 **1000 USER PRESSURE TEST SYSTEM**

## 📋 **OVERVIEW**

This pressure test system simulates 1000 users performing all major actions in the app, from advertiser credit purchase to viewer reward earning, providing comprehensive performance insights.

---

## 🎯 **TEST SCENARIOS**

### **1. Advertiser Flow (250 users)**
- Login as advertiser
- Purchase credit (1000 KWD each)
- Buy all 4 package types (P10, P15, P20, P30)
- Create ads for each package
- Submit ads for review

### **2. Admin Flow (1 admin)**
- Login as admin
- Review and approve ads
- Activate approved ads
- Monitor system performance

### **3. Viewer Flow (750 users)**
- Login as viewer
- Browse available ads
- Watch videos (all 4 package types)
- Earn rewards
- Check wallet balance

### **4. Concurrent Load (200 users)**
- Mixed operations simultaneously
- High-frequency ad watching
- Concurrent package purchases
- Real-time reward distribution

---

## 📁 **FILE STRUCTURE**

```
pressure-test/
├── test-config.js           # Test configuration and constants
├── test-utils.js            # API utilities and performance monitoring
├── test-setup.js            # Test user creation and data setup
├── test-scenarios.js        # Test scenarios and flows
├── run-pressure-test.js     # Main pressure test runner
├── quick-test.js            # Quick test with fewer users
├── results/                 # Generated test reports
└── README.md               # This file
```

---

## 🚀 **QUICK START**

### **1. Run Quick Test (Recommended First)**
```bash
cd backend
node pressure-test/quick-test.js
```

This runs a test with 10 users to verify the infrastructure is working correctly.

### **2. Run Full Pressure Test**
```bash
cd backend
node pressure-test/run-pressure-test.js
```

This runs the complete 1000 user pressure test.

---

## ⚙️ **CONFIGURATION**

### **Test Configuration** (`test-config.js`)
```javascript
TEST_CONFIG: {
  database: 'viewapp_postgres',
  userPrefix: 'pressure_test_',
  maxConcurrentUsers: 1000,
  testDuration: 30 * 60 * 1000, // 30 minutes
  cleanupAfterTest: true,
  batchSize: 50, // Users per batch
  batchDelay: 1000, // 1 second between batches
}
```

### **User Distribution**
- **Advertisers**: 250 (25%)
- **Viewers**: 750 (75%)
- **Admins**: 1 (1%)

### **Test Data**
- **Advertiser Credit**: 1000 KWD per advertiser
- **Package Budget**: 300 KWD per package purchase
- **Ads per Advertiser**: 4 (one per package type)
- **Videos per Viewer**: 10

---

## 📊 **PERFORMANCE METRICS**

### **Response Time Metrics**
- API endpoint response times
- Database query performance
- Frontend rendering times

### **Throughput Metrics**
- Requests per second (RPS)
- Concurrent user handling
- Database transactions per second

### **Business Metrics**
- Successful ad purchases
- Reward distribution accuracy
- Package completion rates
- Error rates and types

---

## 🔒 **SAFETY FEATURES**

### **1. Test Data Isolation**
- Uses `pressure_test_` prefix for all test data
- Isolated from production data
- Automatic cleanup after testing

### **2. Non-Destructive Testing**
- No changes to existing production data
- Read-only access to critical tables
- Rollback capability for all operations

### **3. Resource Management**
- Controlled API rate limiting
- Database connection pooling
- Memory and CPU monitoring

### **4. Error Handling**
- Graceful failure handling
- Detailed error logging
- Automatic cleanup on failure

---

## 📈 **TEST PHASES**

### **Phase 1: Setup**
- Create test users (1000 total)
- Setup initial data
- Verify database connection

### **Phase 2: Advertiser Flow**
- Process 250 advertisers in batches
- Purchase packages and create ads
- Collect created ads for approval

### **Phase 3: Admin Flow**
- Approve and activate all created ads
- Monitor approval process

### **Phase 4: Viewer Flow**
- Process 750 viewers in batches
- Watch videos and earn rewards
- Track reward distribution

### **Phase 5: Concurrent Load**
- Mixed operations with 200 users
- High-frequency testing
- Performance under load

### **Phase 6: Report Generation**
- Comprehensive performance analysis
- Business metrics calculation
- Optimization recommendations

### **Phase 7: Cleanup**
- Remove all test data
- Reset database state
- Generate final report

---

## 📄 **REPORTS**

### **Console Output**
Real-time progress and metrics during test execution.

### **Detailed JSON Report**
Saved to `pressure-test/results/pressure-test-report-{timestamp}.json`

### **Report Contents**
- Test summary and duration
- Performance metrics
- Business metrics
- Error analysis
- Optimization recommendations

---

## ⚠️ **PREREQUISITES**

### **1. Database Setup**
- Ensure database is running
- Run migrations and seeders
- Verify package data exists

### **2. Backend Server**
- Start the backend server
- Ensure API endpoints are accessible
- Verify authentication is working

### **3. Environment Variables**
- Database connection string
- API base URL
- Authentication tokens (if needed)

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Database Connection Error**
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure database is running and connection string is correct.

#### **2. API Endpoint Not Found**
```
Error: 404 Not Found
```
**Solution**: Verify backend server is running and API endpoints are accessible.

#### **3. Authentication Failed**
```
Error: 401 Unauthorized
```
**Solution**: Check authentication configuration and user credentials.

#### **4. Memory Issues**
```
Error: JavaScript heap out of memory
```
**Solution**: Increase Node.js memory limit: `node --max-old-space-size=4096 pressure-test/run-pressure-test.js`

### **Debug Mode**
Add `DEBUG=true` to see detailed API requests and responses.

---

## 📊 **EXPECTED RESULTS**

### **Performance Targets**
- **Error Rate**: < 5%
- **Average Response Time**: < 1 second
- **Max Response Time**: < 5 seconds
- **Concurrent Users**: 1000

### **Business Targets**
- **Advertiser Success Rate**: > 95%
- **Viewer Success Rate**: > 95%
- **Package Purchase Success**: > 95%
- **Reward Distribution Accuracy**: 100%

---

## 🎯 **OPTIMIZATION RECOMMENDATIONS**

### **If Error Rate > 5%**
- Implement retry mechanisms
- Optimize error handling
- Add circuit breakers

### **If Response Time > 1 second**
- Implement caching
- Optimize database queries
- Add connection pooling

### **If Memory Usage High**
- Implement garbage collection
- Optimize data structures
- Add memory monitoring

---

## 📞 **SUPPORT**

For issues or questions about the pressure test system:

1. Check the troubleshooting section
2. Review the console output for errors
3. Check the generated reports for insights
4. Verify all prerequisites are met

---

## 🔄 **UPDATES**

### **Version 1.0**
- Initial pressure test implementation
- 1000 user simulation
- Comprehensive reporting
- Safety features and cleanup

### **Future Enhancements**
- Real-time monitoring dashboard
- Load testing with external tools
- Automated performance regression testing
- Integration with CI/CD pipeline
