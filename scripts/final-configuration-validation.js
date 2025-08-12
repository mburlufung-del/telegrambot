#!/usr/bin/env node

/**
 * Final Configuration Validation
 * Comprehensive test of all configuration fixes for cross-platform deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

function validateFinalConfiguration() {
  console.log('🎯 Final Configuration Validation for Cross-Platform Deployment\n');
  
  const validationResults = {
    startCommands: validateStartCommands(),
    portConfiguration: validatePortConfiguration(),
    hostBinding: validateHostBinding(),
    environmentVariables: validateEnvironmentVariables(),
    buildProcess: validateBuildProcess(),
    platformReadiness: validatePlatformReadiness()
  };
  
  return validationResults;
}

function validateStartCommands() {
  console.log('📋 Validating Start Commands...');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = pkg.scripts || {};
    
    const validationChecks = [
      {
        name: 'Development start command',
        check: scripts.dev && scripts.dev.includes('tsx server/index.ts'),
        expected: 'NODE_ENV=development tsx server/index.ts'
      },
      {
        name: 'Production start command',
        check: scripts.start && scripts.start.includes('node dist/index.js'),
        expected: 'NODE_ENV=production node dist/index.js'
      },
      {
        name: 'Build command',
        check: scripts.build && (scripts.build.includes('vite build') || scripts.build.includes('esbuild')),
        expected: 'vite build && esbuild server/index.ts...'
      }
    ];
    
    const results = validationChecks.map(check => {
      const status = check.check ? 'PASS' : 'FAIL';
      console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${check.name}: ${status}`);
      return { ...check, status };
    });
    
    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    return { passed: allPassed, details: results };
    
  } catch (error) {
    console.log(`   ❌ Error reading package.json: ${error.message}\n`);
    return { passed: false, error: error.message };
  }
}

function validatePortConfiguration() {
  console.log('🔌 Validating Port Configuration...');
  
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    const checks = [
      {
        name: 'Uses process.env.PORT',
        check: serverCode.includes('process.env.PORT'),
        details: 'Server reads port from environment variable'
      },
      {
        name: 'Has fallback port',
        check: serverCode.includes("|| '5000'") || serverCode.includes('|| 5000'),
        details: 'Server has default port for development'
      },
      {
        name: 'Proper port parsing',
        check: serverCode.includes('parseInt('),
        details: 'Port is parsed as integer'
      }
    ];
    
    const results = checks.map(check => {
      const status = check.check ? 'PASS' : 'FAIL';
      console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${check.name}: ${status}`);
      return { ...check, status };
    });
    
    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    return { passed: allPassed, details: results };
    
  } catch (error) {
    console.log(`   ❌ Error reading server code: ${error.message}\n`);
    return { passed: false, error: error.message };
  }
}

function validateHostBinding() {
  console.log('🌐 Validating Host Binding...');
  
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    const checks = [
      {
        name: 'Binds to 0.0.0.0',
        check: serverCode.includes('0.0.0.0'),
        details: 'Server accepts connections from any IP (container-friendly)'
      },
      {
        name: 'Not hardcoded to localhost',
        check: !serverCode.includes('localhost') && !serverCode.includes('127.0.0.1'),
        details: 'Avoids localhost binding issues in containers'
      }
    ];
    
    const results = checks.map(check => {
      const status = check.check ? 'PASS' : 'FAIL';
      console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${check.name}: ${status}`);
      return { ...check, status };
    });
    
    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    return { passed: allPassed, details: results };
    
  } catch (error) {
    console.log(`   ❌ Error reading server code: ${error.message}\n`);
    return { passed: false, error: error.message };
  }
}

function validateEnvironmentVariables() {
  console.log('🔧 Validating Environment Variable Support...');
  
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    const checks = [
      {
        name: 'NODE_ENV detection',
        check: serverCode.includes('NODE_ENV') || serverCode.includes('app.get("env")'),
        details: 'Server detects development vs production'
      },
      {
        name: 'Environment template exists',
        check: fs.existsSync('.env.example'),
        details: 'Template for required environment variables'
      }
    ];
    
    const results = checks.map(check => {
      const status = check.check ? 'PASS' : 'FAIL';
      console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${check.name}: ${status}`);
      return { ...check, status };
    });
    
    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    return { passed: allPassed, details: results };
    
  } catch (error) {
    console.log(`   ❌ Error validating environment support: ${error.message}\n`);
    return { passed: false, error: error.message };
  }
}

function validateBuildProcess() {
  console.log('🔨 Validating Build Process...');
  
  try {
    // Test if build command exists and runs
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.scripts || !pkg.scripts.build) {
      console.log('   ❌ Build script missing\n');
      return { passed: false, error: 'No build script found' };
    }
    
    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    console.log('   Testing build process...');
    execSync('npm run build', { stdio: 'pipe' });
    
    const checks = [
      {
        name: 'Server bundle created',
        check: fs.existsSync('dist/index.js'),
        details: 'Compiled server JavaScript exists'
      },
      {
        name: 'Client build created',
        check: fs.existsSync('dist/public/index.html'),
        details: 'Client build artifacts exist'
      }
    ];
    
    const results = checks.map(check => {
      const status = check.check ? 'PASS' : 'FAIL';
      console.log(`   ${status === 'PASS' ? '✅' : '❌'} ${check.name}: ${status}`);
      return { ...check, status };
    });
    
    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`   Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    return { passed: allPassed, details: results };
    
  } catch (error) {
    console.log(`   ❌ Build process failed: ${error.message}\n`);
    return { passed: false, error: error.message };
  }
}

function validatePlatformReadiness() {
  console.log('🏗️ Validating Platform Readiness...');
  
  const platforms = ['railway', 'vercel', 'docker'];
  const results = {};
  
  platforms.forEach(platform => {
    try {
      const result = execSync(`node scripts/package-compatibility.js check ${platform}`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      const status = result.includes('✅') ? 'READY' : 'WARNINGS';
      console.log(`   ${status === 'READY' ? '✅' : '⚠️'} ${platform}: ${status}`);
      results[platform] = status;
      
    } catch (error) {
      console.log(`   ❌ ${platform}: FAILED`);
      results[platform] = 'FAILED';
    }
  });
  
  const allReady = Object.values(results).every(status => status === 'READY' || status === 'WARNINGS');
  console.log(`   Overall: ${allReady ? '✅ READY' : '❌ ISSUES'}\n`);
  
  return { passed: allReady, platforms: results };
}

function generateFinalReport(validationResults) {
  console.log('📊 Final Configuration Validation Report\n');
  
  const categories = [
    { name: 'Start Commands', result: validationResults.startCommands },
    { name: 'Port Configuration', result: validationResults.portConfiguration },
    { name: 'Host Binding', result: validationResults.hostBinding },
    { name: 'Environment Variables', result: validationResults.environmentVariables },
    { name: 'Build Process', result: validationResults.buildProcess },
    { name: 'Platform Readiness', result: validationResults.platformReadiness }
  ];
  
  let passedCount = 0;
  categories.forEach(category => {
    const status = category.result.passed ? 'PASS' : 'FAIL';
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${category.name}: ${status}`);
    if (status === 'PASS') passedCount++;
  });
  
  const successRate = (passedCount / categories.length) * 100;
  
  console.log(`\nSuccess Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('\n🎉 CONFIGURATION PERFECT!');
    console.log('   All configuration issues have been resolved');
    console.log('   Your TeleShop Bot is ready for cross-platform deployment');
    console.log('\n📋 Deployment Commands:');
    console.log('   Railway: node scripts/platform-setup.js setup railway');
    console.log('   Vercel:  node scripts/platform-setup.js setup vercel');
    console.log('   Docker:  docker-compose up --build');
  } else if (successRate >= 80) {
    console.log('\n✅ MOSTLY READY');
    console.log('   Minor issues may exist but deployment should work');
    console.log('   Review failed checks above');
  } else {
    console.log('\n❌ NEEDS WORK');
    console.log('   Critical configuration issues must be fixed');
    console.log('   Review all failed checks above');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    successRate: successRate,
    summary: successRate === 100 ? 'PERFECT' : successRate >= 80 ? 'MOSTLY_READY' : 'NEEDS_WORK',
    validationResults: validationResults
  };
  
  fs.writeFileSync('final-configuration-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to final-configuration-report.json');
  
  return report;
}

// Run validation
const results = validateFinalConfiguration();
generateFinalReport(results);