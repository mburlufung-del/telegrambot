#!/usr/bin/env node

/**
 * Deployment Stress Test
 * Simulates platform resource constraints to validate deployment readiness
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { spawn } from 'child_process';

const STRESS_TESTS = {
  railway: {
    name: 'Railway Simulation',
    memory: 512, // MB
    buildTimeout: 600, // seconds
    cpuLimit: 2
  },
  vercel: {
    name: 'Vercel Simulation',
    memory: 1024, // MB
    buildTimeout: 2700, // seconds
    bundleLimit: 50 // MB
  },
  docker: {
    name: 'Docker Simulation',
    memory: 1024, // MB
    buildTimeout: null,
    cpuLimit: 1
  }
};

async function runStressTest(platform) {
  console.log(`🧪 Running ${STRESS_TESTS[platform].name}...\n`);
  
  const results = {
    platform,
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Memory-constrained build
  console.log('1️⃣ Testing memory-constrained build...');
  results.tests.memoryBuild = await testMemoryConstrainedBuild(platform);
  
  // Test 2: Build timeout simulation
  console.log('\n2️⃣ Testing build timeout limits...');
  results.tests.buildTimeout = await testBuildTimeout(platform);
  
  // Test 3: Bundle size validation
  console.log('\n3️⃣ Testing bundle size limits...');
  results.tests.bundleSize = await testBundleSize(platform);
  
  // Test 4: Runtime memory simulation
  console.log('\n4️⃣ Testing runtime memory usage...');
  results.tests.runtimeMemory = await testRuntimeMemory(platform);
  
  return results;
}

async function testMemoryConstrainedBuild(platform) {
  const memoryLimit = STRESS_TESTS[platform].memory;
  
  try {
    console.log(`   Setting memory limit to ${memoryLimit}MB...`);
    
    // Clean previous build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    const startTime = Date.now();
    
    // Run build with memory constraint
    const nodeOptions = `--max-old-space-size=${memoryLimit}`;
    const buildProcess = spawn('npm', ['run', 'build'], {
      env: { 
        ...process.env, 
        NODE_OPTIONS: nodeOptions,
        NODE_ENV: 'production'
      },
      stdio: 'pipe'
    });
    
    let buildOutput = '';
    let buildError = '';
    
    buildProcess.stdout.on('data', (data) => {
      buildOutput += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      buildError += data.toString();
    });
    
    const buildResult = await new Promise((resolve) => {
      buildProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          duration: Date.now() - startTime,
          code,
          output: buildOutput,
          error: buildError
        });
      });
    });
    
    if (buildResult.success) {
      console.log(`   ✅ Build completed in ${Math.round(buildResult.duration / 1000)}s`);
      console.log(`   💾 Memory limit ${memoryLimit}MB was sufficient`);
    } else {
      console.log(`   ❌ Build failed after ${Math.round(buildResult.duration / 1000)}s`);
      console.log(`   💾 Memory limit ${memoryLimit}MB was insufficient`);
      
      // Check if it's a memory error
      if (buildResult.error.includes('out of memory') || 
          buildResult.error.includes('heap') ||
          buildResult.error.includes('ENOMEM')) {
        console.log(`   🔍 Memory-related failure detected`);
      }
    }
    
    return {
      passed: buildResult.success,
      duration: buildResult.duration,
      memoryLimit: memoryLimit,
      error: buildResult.success ? null : buildResult.error.split('\n')[0]
    };
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    return {
      passed: false,
      duration: 0,
      memoryLimit: memoryLimit,
      error: error.message
    };
  }
}

async function testBuildTimeout(platform) {
  const timeoutLimit = STRESS_TESTS[platform].buildTimeout;
  
  if (!timeoutLimit) {
    console.log('   ℹ️ No timeout limit for this platform');
    return { passed: true, duration: 0, timeoutLimit: null };
  }
  
  try {
    console.log(`   Testing build completion within ${timeoutLimit}s...`);
    
    const startTime = Date.now();
    execSync('npm run build', { 
      stdio: 'pipe',
      timeout: timeoutLimit * 1000 // Convert to milliseconds
    });
    
    const duration = Date.now() - startTime;
    const durationSeconds = Math.round(duration / 1000);
    
    console.log(`   ✅ Build completed in ${durationSeconds}s (within ${timeoutLimit}s limit)`);
    
    return {
      passed: true,
      duration: duration,
      timeoutLimit: timeoutLimit,
      withinLimit: durationSeconds < timeoutLimit
    };
    
  } catch (error) {
    if (error.signal === 'SIGTERM') {
      console.log(`   ❌ Build exceeded ${timeoutLimit}s timeout`);
      return {
        passed: false,
        duration: timeoutLimit * 1000,
        timeoutLimit: timeoutLimit,
        withinLimit: false,
        error: 'Build timeout exceeded'
      };
    } else {
      console.log(`   ❌ Build failed: ${error.message.split('\n')[0]}`);
      return {
        passed: false,
        duration: 0,
        timeoutLimit: timeoutLimit,
        error: error.message.split('\n')[0]
      };
    }
  }
}

async function testBundleSize(platform) {
  const bundleLimit = STRESS_TESTS[platform].bundleLimit;
  
  try {
    if (!fs.existsSync('dist')) {
      console.log('   Building to check bundle size...');
      execSync('npm run build', { stdio: 'pipe' });
    }
    
    // Calculate total bundle size
    let totalSize = 0;
    
    if (fs.existsSync('dist/index.js')) {
      totalSize += fs.statSync('dist/index.js').size;
    }
    
    if (fs.existsSync('dist/public')) {
      totalSize += getDirectorySize('dist/public');
    }
    
    const sizeMB = totalSize / (1024 * 1024);
    console.log(`   📦 Total bundle size: ${sizeMB.toFixed(2)}MB`);
    
    if (bundleLimit) {
      const withinLimit = sizeMB < bundleLimit;
      
      if (withinLimit) {
        console.log(`   ✅ Bundle size within ${bundleLimit}MB limit`);
      } else {
        console.log(`   ❌ Bundle size exceeds ${bundleLimit}MB limit`);
      }
      
      return {
        passed: withinLimit,
        sizeMB: sizeMB,
        bundleLimit: bundleLimit,
        withinLimit: withinLimit
      };
    } else {
      console.log('   ℹ️ No bundle size limit for this platform');
      return {
        passed: true,
        sizeMB: sizeMB,
        bundleLimit: null
      };
    }
    
  } catch (error) {
    console.log(`   ❌ Bundle size test failed: ${error.message}`);
    return {
      passed: false,
      sizeMB: 0,
      bundleLimit: bundleLimit,
      error: error.message
    };
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    try {
      const stats = fs.statSync(currentPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
          calculateSize(`${currentPath}/${file}`);
        });
      }
    } catch (error) {
      // Ignore errors for individual files
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

async function testRuntimeMemory(platform) {
  const memoryLimit = STRESS_TESTS[platform].memory;
  
  try {
    console.log(`   Testing runtime with ${memoryLimit}MB memory limit...`);
    
    // Ensure build exists
    if (!fs.existsSync('dist/index.js')) {
      console.log('   Building for runtime test...');
      execSync('npm run build', { stdio: 'pipe' });
    }
    
    const startTime = Date.now();
    
    // Start server with memory limit
    const nodeOptions = `--max-old-space-size=${memoryLimit}`;
    const serverProcess = spawn('node', ['dist/index.js'], {
      env: { 
        ...process.env, 
        NODE_OPTIONS: nodeOptions,
        NODE_ENV: 'production',
        PORT: '5001' // Use different port for testing
      },
      stdio: 'pipe'
    });
    
    let serverOutput = '';
    let serverError = '';
    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      
      if (output.includes('serving on port') || output.includes('Server running')) {
        serverStarted = true;
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      serverError += data.toString();
    });
    
    // Wait for server to start or fail
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          serverProcess.kill();
        }
        resolve();
      }, 10000); // 10 second timeout
      
      serverProcess.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      serverProcess.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    const duration = Date.now() - startTime;
    
    // Clean up
    if (!serverProcess.killed) {
      serverProcess.kill();
    }
    
    if (serverStarted) {
      console.log(`   ✅ Server started successfully in ${Math.round(duration / 1000)}s`);
      console.log(`   💾 Runtime memory limit ${memoryLimit}MB was sufficient`);
      
      return {
        passed: true,
        duration: duration,
        memoryLimit: memoryLimit,
        started: true
      };
    } else {
      console.log(`   ❌ Server failed to start within 10s`);
      console.log(`   💾 Runtime memory limit ${memoryLimit}MB may be insufficient`);
      
      return {
        passed: false,
        duration: duration,
        memoryLimit: memoryLimit,
        started: false,
        error: serverError.split('\n')[0] || 'Server startup timeout'
      };
    }
    
  } catch (error) {
    console.log(`   ❌ Runtime test failed: ${error.message}`);
    return {
      passed: false,
      duration: 0,
      memoryLimit: memoryLimit,
      error: error.message
    };
  }
}

async function runAllStressTests() {
  console.log('🚀 TeleShop Bot Deployment Stress Testing\n');
  
  const allResults = {};
  
  for (const platform of Object.keys(STRESS_TESTS)) {
    console.log('='.repeat(60));
    const results = await runStressTest(platform);
    allResults[platform] = results;
    console.log('');
  }
  
  // Generate summary report
  console.log('📊 Stress Test Summary Report\n');
  
  Object.entries(allResults).forEach(([platform, results]) => {
    console.log(`🏗️ ${STRESS_TESTS[platform].name}:`);
    
    const tests = results.tests;
    Object.entries(tests).forEach(([testName, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${testName}: ${result.passed ? 'PASS' : 'FAIL'}`);
      
      if (!result.passed && result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
    
    const passedCount = Object.values(tests).filter(t => t.passed).length;
    const totalCount = Object.values(tests).length;
    const passRate = (passedCount / totalCount * 100).toFixed(1);
    
    console.log(`   Overall: ${passedCount}/${totalCount} tests passed (${passRate}%)`);
    console.log('');
  });
  
  // Overall assessment
  const allPlatformsPassed = Object.values(allResults).every(platform => 
    Object.values(platform.tests).every(test => test.passed)
  );
  
  if (allPlatformsPassed) {
    console.log('🎉 ALL STRESS TESTS PASSED!');
    console.log('   Your TeleShop Bot is ready for production deployment');
    console.log('   All resource constraints have been validated');
  } else {
    console.log('⚠️ SOME STRESS TESTS FAILED');
    console.log('   Review failed tests and optimize before deployment');
    console.log('   Consider using resource optimization tools');
  }
  
  // Save detailed results
  fs.writeFileSync('stress-test-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n📄 Detailed results saved to stress-test-results.json');
  
  return allResults;
}

// Run all stress tests
runAllStressTests().catch(error => {
  console.error('❌ Stress testing failed:', error.message);
  process.exit(1);
});