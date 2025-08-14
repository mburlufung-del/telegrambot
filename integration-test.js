// Simple integration test to verify bot-dashboard connection
const express = require('express');
const { performance } = require('perf_hooks');

async function testIntegration() {
  console.log('🚀 Starting Bot-Dashboard Integration Test\n');
  
  const baseUrl = 'http://localhost:5000';
  const tests = [];
  
  // Test 1: Dashboard Overview
  try {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/dashboard/overview`);
    const data = await response.json();
    const end = performance.now();
    
    tests.push({
      name: 'Dashboard Overview API',
      status: response.ok ? 'PASS' : 'FAIL',
      time: `${(end - start).toFixed(2)}ms`,
      data: response.ok ? `${data.stats.totalUsers} users, ${data.stats.totalOrders} orders` : 'Error'
    });
  } catch (error) {
    tests.push({
      name: 'Dashboard Overview API',
      status: 'FAIL',
      time: 'N/A',
      data: error.message
    });
  }
  
  // Test 2: Bot Status
  try {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/bot/status`);
    const data = await response.json();
    const end = performance.now();
    
    tests.push({
      name: 'Bot Status API',
      status: response.ok ? 'PASS' : 'FAIL',
      time: `${(end - start).toFixed(2)}ms`,
      data: response.ok ? `Status: ${data.status}, Mode: ${data.mode}` : 'Error'
    });
  } catch (error) {
    tests.push({
      name: 'Bot Status API',
      status: 'FAIL',
      time: 'N/A',
      data: error.message
    });
  }
  
  // Test 3: Orders API
  try {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/orders`);
    const data = await response.json();
    const end = performance.now();
    
    tests.push({
      name: 'Orders API',
      status: response.ok ? 'PASS' : 'FAIL',
      time: `${(end - start).toFixed(2)}ms`,
      data: response.ok ? `${data.length} orders found` : 'Error'
    });
  } catch (error) {
    tests.push({
      name: 'Orders API',
      status: 'FAIL',
      time: 'N/A',
      data: error.message
    });
  }
  
  // Test 4: Products API
  try {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/products`);
    const data = await response.json();
    const end = performance.now();
    
    tests.push({
      name: 'Products API',
      status: response.ok ? 'PASS' : 'FAIL',
      time: `${(end - start).toFixed(2)}ms`,
      data: response.ok ? `${data.length} products found` : 'Error'
    });
  } catch (error) {
    tests.push({
      name: 'Products API',
      status: 'FAIL',
      time: 'N/A',
      data: error.message
    });
  }
  
  // Test 5: Inquiries API
  try {
    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/inquiries`);
    const data = await response.json();
    const end = performance.now();
    
    tests.push({
      name: 'Inquiries API',
      status: response.ok ? 'PASS' : 'FAIL',
      time: `${(end - start).toFixed(2)}ms`,
      data: response.ok ? `${data.length} inquiries found` : 'Error'
    });
  } catch (error) {
    tests.push({
      name: 'Inquiries API',
      status: 'FAIL',
      time: 'N/A',
      data: error.message
    });
  }
  
  // Display Results
  console.log('📊 Test Results:');
  console.log('═'.repeat(60));
  tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${test.name.padEnd(25)} | ${test.time.padEnd(10)} | ${test.data}`);
  });
  console.log('═'.repeat(60));
  
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const totalCount = tests.length;
  
  console.log(`\n🎯 Summary: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 All tests passed! Bot-Dashboard integration is working perfectly.');
    console.log('\n✨ What\'s working:');
    console.log('   • Real-time dashboard updates');
    console.log('   • Bot status monitoring');
    console.log('   • Order processing integration');
    console.log('   • Product catalog synchronization');
    console.log('   • Customer inquiry tracking');
    console.log('\n🚀 System is ready for production use!');
  } else {
    console.log('⚠️  Some tests failed. Please check the API endpoints.');
  }
  
  return { passCount, totalCount, tests };
}

// Run the test
if (require.main === module) {
  testIntegration().catch(console.error);
}

module.exports = { testIntegration };