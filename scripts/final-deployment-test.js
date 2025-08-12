#!/usr/bin/env node

/**
 * Final Deployment Readiness Test
 * Comprehensive validation before platform deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

const PLATFORMS = ['railway', 'vercel', 'docker', 'replit'];

async function runComprehensiveTest() {
  console.log('🚀 TeleShop Bot - Final Deployment Readiness Test\n');
  
  const results = {
    environment: null,
    runtime: null,
    dependencies: null,
    platforms: {}
  };

  // 1. Environment Check
  console.log('1️⃣ Environment Variables Check...');
  try {
    const envResult = execSync('node scripts/env-check.js check', { encoding: 'utf8' });
    results.environment = envResult.includes('✅') ? 'PASS' : 'ISSUES';
    console.log(results.environment === 'PASS' ? '✅ Environment: PASS' : '⚠️ Environment: Issues found');
  } catch (error) {
    results.environment = 'FAIL';
    console.log('❌ Environment: FAIL');
  }

  // 2. Runtime Compatibility
  console.log('\n2️⃣ Runtime Compatibility Check...');
  try {
    const runtimeResult = execSync('node scripts/runtime-check.js check', { encoding: 'utf8' });
    results.runtime = runtimeResult.includes('✅') ? 'PASS' : 'ISSUES';
    console.log(results.runtime === 'PASS' ? '✅ Runtime: PASS' : '⚠️ Runtime: Issues found');
  } catch (error) {
    results.runtime = 'FAIL';
    console.log('❌ Runtime: FAIL');
  }

  // 3. Dependencies Audit
  console.log('\n3️⃣ Dependencies Audit...');
  try {
    const depResult = execSync('node scripts/dependency-audit.js audit', { encoding: 'utf8' });
    results.dependencies = depResult.includes('✅') ? 'PASS' : 'ISSUES';
    console.log(results.dependencies === 'PASS' ? '✅ Dependencies: PASS' : '⚠️ Dependencies: Issues found');
  } catch (error) {
    results.dependencies = 'FAIL';
    console.log('❌ Dependencies: FAIL');
  }

  // 4. Platform-Specific Tests
  console.log('\n4️⃣ Platform Compatibility Tests...');
  for (const platform of PLATFORMS) {
    try {
      const platformResult = execSync(`node scripts/package-compatibility.js check ${platform}`, { encoding: 'utf8' });
      results.platforms[platform] = platformResult.includes('✅') ? 'PASS' : 'ISSUES';
      console.log(`   ${platform}: ${results.platforms[platform] === 'PASS' ? '✅' : '⚠️'} ${results.platforms[platform]}`);
    } catch (error) {
      results.platforms[platform] = 'FAIL';
      console.log(`   ${platform}: ❌ FAIL`);
    }
  }

  // 5. Build Test
  console.log('\n5️⃣ Build Process Test...');
  let buildResult = 'FAIL';
  try {
    console.log('   Testing client build...');
    execSync('npm run build:client', { stdio: 'pipe' });
    console.log('   Testing server build...');
    execSync('npm run build:server', { stdio: 'pipe' });
    buildResult = 'PASS';
    console.log('✅ Build: PASS');
  } catch (error) {
    try {
      // Fallback to combined build
      execSync('npm run build', { stdio: 'pipe' });
      buildResult = 'PASS';
      console.log('✅ Build: PASS');
    } catch (buildError) {
      console.log('❌ Build: FAIL');
      console.log('   Error:', buildError.message.split('\n')[0]);
    }
  }

  // Summary Report
  console.log('\n📊 Final Deployment Readiness Report\n');
  
  const checks = [
    { name: 'Environment Variables', result: results.environment },
    { name: 'Runtime Compatibility', result: results.runtime },
    { name: 'Dependencies', result: results.dependencies },
    { name: 'Build Process', result: buildResult }
  ];

  checks.forEach(check => {
    const icon = check.result === 'PASS' ? '✅' : 
                 check.result === 'ISSUES' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.result}`);
  });

  console.log('\n🏗️ Platform Readiness:');
  Object.entries(results.platforms).forEach(([platform, result]) => {
    const icon = result === 'PASS' ? '✅' : 
                 result === 'ISSUES' ? '⚠️' : '❌';
    console.log(`${icon} ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${result}`);
  });

  // Overall Status
  const allPassed = checks.every(c => c.result === 'PASS') && 
                   Object.values(results.platforms).every(r => r === 'PASS');
  
  const hasIssues = checks.some(c => c.result === 'ISSUES') || 
                   Object.values(results.platforms).some(r => r === 'ISSUES');

  console.log('\n🎯 Overall Status:');
  if (allPassed) {
    console.log('🎉 READY FOR DEPLOYMENT!');
    console.log('   Your TeleShop Bot is fully compatible across all platforms.');
    console.log('   You can proceed with deployment to any supported platform.');
  } else if (hasIssues) {
    console.log('⚠️ READY WITH MINOR ISSUES');
    console.log('   Your bot can be deployed but some optimizations are recommended.');
    console.log('   Review warnings above for best practices.');
  } else {
    console.log('❌ NOT READY');
    console.log('   Critical issues must be resolved before deployment.');
    console.log('   Run individual check commands to see detailed issues.');
  }

  // Next Steps
  console.log('\n📋 Next Steps:');
  if (allPassed || hasIssues) {
    console.log('1. Choose your deployment platform:');
    console.log('   • Railway: node scripts/platform-setup.js setup railway');
    console.log('   • Vercel: node scripts/platform-setup.js setup vercel');
    console.log('   • Docker: node scripts/platform-setup.js setup docker');
    console.log('');
    console.log('2. Set up environment variables for your platform');
    console.log('3. Deploy using platform-specific instructions');
    console.log('4. Test bot functionality after deployment');
  } else {
    console.log('1. Fix critical issues found above');
    console.log('2. Run this test again: node scripts/final-deployment-test.js');
    console.log('3. Proceed with deployment once all tests pass');
  }

  return {
    ready: allPassed || hasIssues,
    critical: !allPassed && !hasIssues,
    results
  };
}

// Run the test
runComprehensiveTest().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});