#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

async function runAllTests() {
  console.log('🚀 Running All NEXT Button Logic Tests...\n');
  
  const tests = [
    {
      name: 'Next Button Logic Test',
      file: 'test-next-button-logic.js',
      description: 'Tests database schema, budget calculations, and numeric overflow prevention'
    },
    {
      name: 'Frontend State Flow Test',
      file: 'test-frontend-state-flow.js',
      description: 'Tests viewer authentication, view events, and reward processing simulation'
    },
    {
      name: 'API Endpoints Test',
      file: 'test-api-endpoints.js',
      description: 'Tests backend server status, API endpoints, and response formats'
    },
    {
      name: 'Complete Flow Test',
      file: 'test-complete-next-button-flow.js',
      description: 'Tests the complete end-to-end flow from video start to NEXT button completion'
    }
  ];
  
  const results = [];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Test ${i + 1}/${tests.length}: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    console.log(`${'='.repeat(80)}\n`);
    
    try {
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(`node ${test.file}`, {
        cwd: __dirname,
        timeout: 60000 // 60 second timeout
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(stdout);
      if (stderr) {
        console.log('⚠️  Warnings/Errors:', stderr);
      }
      
      results.push({
        name: test.name,
        status: 'PASSED',
        duration: duration,
        output: stdout,
        errors: stderr
      });
      
      console.log(`\n✅ ${test.name} completed successfully in ${duration}ms`);
      
    } catch (error) {
      console.error(`\n❌ ${test.name} failed:`);
      console.error('Error:', error.message);
      
      if (error.stdout) {
        console.log('Output:', error.stdout);
      }
      if (error.stderr) {
        console.log('Errors:', error.stderr);
      }
      
      results.push({
        name: test.name,
        status: 'FAILED',
        duration: 0,
        output: error.stdout || '',
        errors: error.stderr || error.message
      });
    }
    
    // Wait a bit between tests
    if (i < tests.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary Report
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY REPORT');
  console.log(`${'='.repeat(80)}`);
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ❌`);
  console.log(`   Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  
  console.log(`\n📋 Individual Test Results:`);
  results.forEach((result, index) => {
    const statusIcon = result.status === 'PASSED' ? '✅' : '❌';
    const durationText = result.duration > 0 ? ` (${result.duration}ms)` : '';
    console.log(`   ${index + 1}. ${statusIcon} ${result.name}${durationText}`);
  });
  
  if (failed > 0) {
    console.log(`\n❌ Failed Tests Details:`);
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`\n   🔍 ${result.name}:`);
      if (result.errors) {
        console.log(`      Errors: ${result.errors}`);
      }
    });
  }
  
  console.log(`\n${'='.repeat(80)}`);
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! NEXT Button Logic is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log(`${'='.repeat(80)}`);
  
  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Tests interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Tests terminated');
  process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
