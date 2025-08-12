#!/usr/bin/env node

/**
 * Comprehensive Deployment Configuration Test
 * Tests all platform configurations and validates deployment readiness
 */

import fs from 'fs';
import { execSync } from 'child_process';

const DEPLOYMENT_TESTS = {
  server: {
    name: 'Server Configuration',
    tests: [
      {
        name: 'Port Configuration',
        check: () => {
          const serverCode = fs.readFileSync('server/index.ts', 'utf8');
          return serverCode.includes('process.env.PORT');
        }
      },
      {
        name: 'Host Binding',
        check: () => {
          const serverCode = fs.readFileSync('server/index.ts', 'utf8');
          return serverCode.includes('0.0.0.0');
        }
      },
      {
        name: 'Environment Detection',
        check: () => {
          const serverCode = fs.readFileSync('server/index.ts', 'utf8');
          return serverCode.includes('app.get("env")') || serverCode.includes('NODE_ENV');
        }
      }
    ]
  },

  scripts: {
    name: 'Package Scripts',
    tests: [
      {
        name: 'Start Script',
        check: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.scripts && pkg.scripts.start;
        }
      },
      {
        name: 'Build Script',
        check: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.scripts && pkg.scripts.build;
        }
      },
      {
        name: 'Development Script',
        check: () => {
          const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          return pkg.scripts && pkg.scripts.dev;
        }
      }
    ]
  },

  platform: {
    name: 'Platform Configurations',
    tests: [
      {
        name: 'Railway Config',
        check: () => fs.existsSync('railway.toml')
      },
      {
        name: 'Docker Support',
        check: () => fs.existsSync('Dockerfile')
      },
      {
        name: 'Environment Template',
        check: () => fs.existsSync('.env.example')
      }
    ]
  }
};

function runDeploymentTests() {
  console.log('🧪 Comprehensive Deployment Configuration Test\n');
  
  let totalTests = 0;
  let passedTests = 0;
  const results = {};

  Object.entries(DEPLOYMENT_TESTS).forEach(([category, config]) => {
    console.log(`📋 ${config.name}:`);
    results[category] = [];
    
    config.tests.forEach(test => {
      totalTests++;
      try {
        const passed = test.check();
        if (passed) {
          passedTests++;
          console.log(`   ✅ ${test.name}`);
          results[category].push({ name: test.name, status: 'PASS' });
        } else {
          console.log(`   ❌ ${test.name}`);
          results[category].push({ name: test.name, status: 'FAIL' });
        }
      } catch (error) {
        console.log(`   ❌ ${test.name} (Error: ${error.message})`);
        results[category].push({ name: test.name, status: 'ERROR', error: error.message });
      }
    });
    console.log('');
  });

  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100,
    results
  };
}

function testBuildProcess() {
  console.log('\n🔨 Testing Build Process...\n');
  
  try {
    console.log('   Cleaning previous builds...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    console.log('   Running build command...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Check if build outputs exist
    const buildChecks = [
      { path: 'dist/index.js', name: 'Server bundle' },
      { path: 'client/dist/index.html', name: 'Client build' }
    ];
    
    let buildSuccess = true;
    buildChecks.forEach(check => {
      if (fs.existsSync(check.path)) {
        console.log(`   ✅ ${check.name} created`);
      } else {
        console.log(`   ❌ ${check.name} missing`);
        buildSuccess = false;
      }
    });
    
    if (buildSuccess) {
      console.log('\n✅ Build process completed successfully');
      return true;
    } else {
      console.log('\n❌ Build process has issues');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Build failed: ${error.message}`);
    return false;
  }
}

function testPlatformCompatibility() {
  console.log('\n🏗️ Testing Platform Compatibility...\n');
  
  const platforms = ['railway', 'vercel', 'docker'];
  const results = {};
  
  platforms.forEach(platform => {
    console.log(`   Testing ${platform} compatibility...`);
    
    try {
      const result = execSync(`node scripts/package-compatibility.js check ${platform}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (result.includes('✅')) {
        console.log(`   ✅ ${platform} ready`);
        results[platform] = 'READY';
      } else {
        console.log(`   ⚠️ ${platform} has warnings`);
        results[platform] = 'WARNINGS';
      }
    } catch (error) {
      console.log(`   ❌ ${platform} failed`);
      results[platform] = 'FAILED';
    }
  });
  
  return results;
}

function generateDeploymentReport() {
  console.log('\n📄 Generating Final Deployment Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    configuration: runDeploymentTests(),
    build: testBuildProcess(),
    platforms: testPlatformCompatibility()
  };
  
  // Overall assessment
  console.log('\n🎯 Overall Deployment Readiness:\n');
  
  const configReady = report.configuration.successRate >= 80;
  const buildReady = report.build;
  const platformsReady = Object.values(report.platforms).every(status => 
    status === 'READY' || status === 'WARNINGS');
  
  if (configReady && buildReady && platformsReady) {
    console.log('🎉 DEPLOYMENT READY!');
    console.log('   All systems green for deployment');
    console.log('   Choose your platform and deploy');
  } else {
    console.log('⚠️ NEEDS ATTENTION');
    console.log('   Some issues need resolution before deployment');
    
    if (!configReady) console.log('   • Configuration issues detected');
    if (!buildReady) console.log('   • Build process needs fixing');
    if (!platformsReady) console.log('   • Platform compatibility issues');
  }
  
  console.log('\n📋 Quick Deployment Commands:');
  console.log('   Railway: node scripts/platform-setup.js setup railway');
  console.log('   Vercel:  node scripts/platform-setup.js setup vercel');
  console.log('   Docker:  docker-compose up --build');
  
  // Save detailed report
  fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to deployment-report.json');
  
  return report;
}

// Run comprehensive test
generateDeploymentReport();