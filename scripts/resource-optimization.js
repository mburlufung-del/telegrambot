#!/usr/bin/env node

/**
 * Resource Optimization Tool for Cross-Platform Deployment
 * Analyzes and optimizes memory, CPU, and build resource usage
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const PLATFORM_LIMITS = {
  replit: {
    name: 'Replit',
    memory: '4GB',
    cpu: '2 cores',
    buildTimeout: 'unlimited',
    diskSpace: '20GB',
    constraints: {
      memory: 4096,
      buildTime: null,
      concurrent: 'limited'
    }
  },
  
  railway: {
    name: 'Railway',
    memory: '8GB build / 512MB-32GB runtime',
    cpu: '8 cores build / 1-32 cores runtime',
    buildTimeout: '10 minutes',
    diskSpace: '100GB',
    constraints: {
      memory: 8192,
      buildTime: 600,
      concurrent: 'high'
    }
  },
  
  vercel: {
    name: 'Vercel',
    memory: '3GB build / 1GB runtime',
    cpu: '4 cores build / serverless runtime',
    buildTimeout: '45 minutes',
    diskSpace: '100GB',
    constraints: {
      memory: 3072,
      buildTime: 2700,
      concurrent: 'medium'
    }
  },
  
  docker: {
    name: 'Docker',
    memory: 'configurable',
    cpu: 'configurable',
    buildTimeout: 'configurable',
    diskSpace: 'configurable',
    constraints: {
      memory: 'unlimited',
      buildTime: null,
      concurrent: 'unlimited'
    }
  }
};

function analyzeResourceUsage() {
  console.log('📊 Analyzing Resource Usage...\n');
  
  const analysis = {
    dependencies: analyzeDependencySize(),
    buildComplexity: analyzeBuildComplexity(),
    bundleSize: analyzeBundleSize(),
    memoryUsage: analyzeMemoryUsage()
  };
  
  return analysis;
}

function analyzeDependencySize() {
  console.log('📦 Dependency Size Analysis:');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    // Heavy dependencies that consume significant resources
    const heavyDependencies = {
      'puppeteer': { size: '~300MB', impact: 'high', alternative: 'playwright-core' },
      'electron': { size: '~150MB', impact: 'high', alternative: 'tauri' },
      'sharp': { size: '~30MB', impact: 'medium', alternative: 'jimp' },
      '@tensorflow/tfjs': { size: '~100MB', impact: 'high', alternative: 'ml5' },
      'canvas': { size: '~20MB', impact: 'medium', alternative: 'fabric' },
      'sqlite3': { size: '~15MB', impact: 'medium', alternative: '@neondatabase/serverless' },
      'fsevents': { size: '~10MB', impact: 'low', alternative: 'chokidar' }
    };
    
    const issues = [];
    const recommendations = [];
    let totalEstimatedSize = 0;
    
    Object.entries(allDeps).forEach(([dep, version]) => {
      if (heavyDependencies[dep]) {
        const heavy = heavyDependencies[dep];
        issues.push({
          dependency: dep,
          size: heavy.size,
          impact: heavy.impact,
          alternative: heavy.alternative
        });
        
        // Estimate size impact
        const sizeNumber = parseInt(heavy.size.replace(/[^\d]/g, ''));
        totalEstimatedSize += sizeNumber;
        
        console.log(`   ⚠️ ${dep}: ${heavy.size} (${heavy.impact} impact)`);
        console.log(`      Alternative: ${heavy.alternative}`);
      }
    });
    
    if (issues.length === 0) {
      console.log('   ✅ No heavy dependencies detected');
    } else {
      console.log(`   📋 Total heavy deps impact: ~${totalEstimatedSize}MB`);
    }
    
    console.log('');
    return { issues, totalEstimatedSize };
    
  } catch (error) {
    console.log(`   ❌ Error analyzing dependencies: ${error.message}\n`);
    return { issues: [], totalEstimatedSize: 0 };
  }
}

function analyzeBuildComplexity() {
  console.log('⚙️ Build Complexity Analysis:');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const buildScript = pkg.scripts?.build || '';
    
    const complexityFactors = {
      vite: { weight: 1, description: 'Standard frontend build' },
      esbuild: { weight: 1, description: 'Fast JavaScript bundling' },
      webpack: { weight: 3, description: 'Complex bundling process' },
      typescript: { weight: 2, description: 'TypeScript compilation' },
      tailwind: { weight: 1, description: 'CSS processing' },
      'drizzle-kit': { weight: 1, description: 'Database schema generation' }
    };
    
    let complexity = 0;
    const factors = [];
    
    Object.entries(complexityFactors).forEach(([tool, config]) => {
      if (buildScript.includes(tool) || pkg.devDependencies?.[tool] || pkg.dependencies?.[tool]) {
        complexity += config.weight;
        factors.push({ tool, weight: config.weight, description: config.description });
        console.log(`   📋 ${tool}: ${config.description} (weight: ${config.weight})`);
      }
    });
    
    // Check for multiple build steps
    const buildSteps = buildScript.split('&&').length;
    if (buildSteps > 1) {
      complexity += buildSteps - 1;
      console.log(`   📋 Multi-step build: ${buildSteps} steps (weight: ${buildSteps - 1})`);
    }
    
    console.log(`   📊 Total complexity score: ${complexity}`);
    
    let assessment;
    if (complexity <= 3) {
      assessment = 'low';
      console.log('   ✅ Low complexity - should build quickly');
    } else if (complexity <= 6) {
      assessment = 'medium';
      console.log('   ⚠️ Medium complexity - may need optimization');
    } else {
      assessment = 'high';
      console.log('   ❌ High complexity - likely to hit timeout limits');
    }
    
    console.log('');
    return { complexity, assessment, factors, buildSteps };
    
  } catch (error) {
    console.log(`   ❌ Error analyzing build complexity: ${error.message}\n`);
    return { complexity: 0, assessment: 'unknown' };
  }
}

function analyzeBundleSize() {
  console.log('📏 Bundle Size Analysis:');
  
  try {
    // Check if build exists
    if (!fs.existsSync('dist')) {
      console.log('   ⚠️ No build found, running build to analyze size...');
      execSync('npm run build', { stdio: 'pipe' });
    }
    
    const bundleInfo = [];
    let totalSize = 0;
    
    // Analyze server bundle
    if (fs.existsSync('dist/index.js')) {
      const serverStats = fs.statSync('dist/index.js');
      const serverSizeKB = Math.round(serverStats.size / 1024);
      bundleInfo.push({ type: 'Server bundle', size: `${serverSizeKB}KB`, path: 'dist/index.js' });
      totalSize += serverStats.size;
      console.log(`   📦 Server bundle: ${serverSizeKB}KB`);
    }
    
    // Analyze client bundle
    if (fs.existsSync('dist/public')) {
      const clientSize = getDirectorySize('dist/public');
      const clientSizeKB = Math.round(clientSize / 1024);
      bundleInfo.push({ type: 'Client bundle', size: `${clientSizeKB}KB`, path: 'dist/public' });
      totalSize += clientSize;
      console.log(`   📦 Client bundle: ${clientSizeKB}KB`);
    }
    
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    console.log(`   📊 Total bundle size: ${totalSizeMB}MB`);
    
    // Size assessment
    let sizeAssessment;
    if (totalSizeMB < 10) {
      sizeAssessment = 'optimal';
      console.log('   ✅ Optimal size for all platforms');
    } else if (totalSizeMB < 50) {
      sizeAssessment = 'acceptable';
      console.log('   ⚠️ Acceptable but may impact Vercel function limits');
    } else {
      sizeAssessment = 'large';
      console.log('   ❌ Large bundle may cause deployment issues');
    }
    
    console.log('');
    return { bundleInfo, totalSizeMB, sizeAssessment };
    
  } catch (error) {
    console.log(`   ❌ Error analyzing bundle size: ${error.message}\n`);
    return { bundleInfo: [], totalSizeMB: 0, sizeAssessment: 'unknown' };
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (error) {
    // Ignore errors for individual files
  }
  
  return totalSize;
}

function analyzeMemoryUsage() {
  console.log('💾 Memory Usage Analysis:');
  
  try {
    // Estimate memory usage based on dependencies and build complexity
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const depCount = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
    
    // Base memory estimate
    let estimatedMemoryMB = 200; // Base Node.js runtime
    
    // Add dependency overhead
    estimatedMemoryMB += depCount * 2; // ~2MB per dependency
    
    // Add framework overhead
    const frameworks = {
      'react': 50,
      'express': 20,
      'vite': 100,
      'typescript': 150,
      'drizzle-orm': 30
    };
    
    Object.entries(frameworks).forEach(([framework, memory]) => {
      if (pkg.dependencies?.[framework] || pkg.devDependencies?.[framework]) {
        estimatedMemoryMB += memory;
        console.log(`   📋 ${framework}: +${memory}MB`);
      }
    });
    
    console.log(`   📊 Estimated runtime memory: ${estimatedMemoryMB}MB`);
    
    // Build memory estimate (usually 2-3x runtime)
    const buildMemoryMB = estimatedMemoryMB * 2.5;
    console.log(`   📊 Estimated build memory: ${Math.round(buildMemoryMB)}MB`);
    
    // Platform compatibility assessment
    const platformCompatibility = {};
    Object.entries(PLATFORM_LIMITS).forEach(([platform, limits]) => {
      if (limits.constraints.memory === 'unlimited') {
        platformCompatibility[platform] = 'compatible';
      } else {
        const isCompatible = buildMemoryMB < limits.constraints.memory;
        platformCompatibility[platform] = isCompatible ? 'compatible' : 'risk';
      }
      
      const status = platformCompatibility[platform] === 'compatible' ? '✅' : '⚠️';
      console.log(`   ${status} ${limits.name}: ${platformCompatibility[platform]}`);
    });
    
    console.log('');
    return { 
      runtimeMemoryMB: estimatedMemoryMB, 
      buildMemoryMB: Math.round(buildMemoryMB),
      platformCompatibility 
    };
    
  } catch (error) {
    console.log(`   ❌ Error analyzing memory usage: ${error.message}\n`);
    return { runtimeMemoryMB: 0, buildMemoryMB: 0, platformCompatibility: {} };
  }
}

function generateOptimizationRecommendations(analysis) {
  console.log('🔧 Optimization Recommendations:\n');
  
  const recommendations = [];
  
  // Dependency optimizations
  if (analysis.dependencies.issues.length > 0) {
    console.log('📦 Dependency Optimizations:');
    analysis.dependencies.issues.forEach(issue => {
      const rec = `Replace ${issue.dependency} with ${issue.alternative} to reduce size by ${issue.size}`;
      recommendations.push(rec);
      console.log(`   • ${rec}`);
    });
    console.log('');
  }
  
  // Build optimizations
  if (analysis.buildComplexity.assessment === 'high') {
    console.log('⚙️ Build Optimizations:');
    const buildRecs = [
      'Split build into parallel steps where possible',
      'Use build caching to reduce repeated work',
      'Consider removing unused dependencies',
      'Optimize TypeScript compilation with incremental builds'
    ];
    
    buildRecs.forEach(rec => {
      recommendations.push(rec);
      console.log(`   • ${rec}`);
    });
    console.log('');
  }
  
  // Bundle size optimizations
  if (analysis.bundleSize.sizeAssessment === 'large') {
    console.log('📏 Bundle Size Optimizations:');
    const sizeRecs = [
      'Enable tree shaking to remove unused code',
      'Use dynamic imports for code splitting',
      'Optimize asset compression',
      'Remove development dependencies from production bundle'
    ];
    
    sizeRecs.forEach(rec => {
      recommendations.push(rec);
      console.log(`   • ${rec}`);
    });
    console.log('');
  }
  
  // Memory optimizations
  const memoryRisks = Object.entries(analysis.memoryUsage.platformCompatibility)
    .filter(([_, status]) => status === 'risk');
    
  if (memoryRisks.length > 0) {
    console.log('💾 Memory Optimizations:');
    const memoryRecs = [
      'Use lighter alternatives for heavy dependencies',
      'Implement lazy loading for non-critical features',
      'Optimize database queries to reduce memory usage',
      'Use streaming for large data processing'
    ];
    
    memoryRecs.forEach(rec => {
      recommendations.push(rec);
      console.log(`   • ${rec}`);
    });
    console.log('');
  }
  
  return recommendations;
}

function generateOptimizedConfigurations() {
  console.log('📋 Generating Optimized Platform Configurations...\n');
  
  // Railway optimization
  const railwayConfig = `# Railway Optimized Configuration
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/bot/status"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

# Resource optimizations
[build.env]
NODE_ENV = "production"
NPM_CONFIG_PREFER_OFFLINE = "true"
NPM_CONFIG_CACHE = "/tmp/.npm"

[env]
NODE_ENV = { default = "production" }
PORT = { default = "5000" }
NODE_OPTIONS = { default = "--max-old-space-size=512" }
`;

  fs.writeFileSync('railway.optimized.toml', railwayConfig);
  console.log('✅ Generated railway.optimized.toml');
  
  // Vercel optimization
  const vercelConfig = {
    version: 2,
    builds: [
      {
        src: 'server/index.ts',
        use: '@vercel/node',
        config: {
          maxLambdaSize: '50mb',
          memory: 1024
        }
      }
    ],
    routes: [
      {
        src: '/api/(.*)',
        dest: '/server/index.ts'
      }
    ],
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    functions: {
      'server/index.ts': {
        memory: 1024,
        maxDuration: 30
      }
    }
  };
  
  fs.writeFileSync('vercel.optimized.json', JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Generated vercel.optimized.json');
  
  // Docker optimization
  const dockerConfig = `# Multi-stage Docker build for resource optimization
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --prefer-offline && npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Production stage
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Resource limits and optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S teleshop -u 1001
RUN chown -R teleshop:nodejs /app
USER teleshop

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/api/bot/status || exit 1

CMD ["npm", "start"]
`;

  fs.writeFileSync('Dockerfile.optimized', dockerConfig);
  console.log('✅ Generated Dockerfile.optimized');
  
  // Build optimization script
  const buildOptScript = `#!/bin/bash
# Build Optimization Script

echo "🔧 Optimizing build for deployment..."

# Clean previous builds
rm -rf dist node_modules/.cache

# Set build environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export NPM_CONFIG_PREFER_OFFLINE=true

# Clean install dependencies
npm ci --prefer-offline

# Run optimized build
echo "📦 Building with optimizations..."
npm run build

# Verify build output
if [ -f "dist/index.js" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Build completed successfully"
    
    # Display build statistics
    echo "📊 Build Statistics:"
    echo "   Server bundle: $(du -h dist/index.js | cut -f1)"
    echo "   Client bundle: $(du -sh dist/public | cut -f1)"
    echo "   Total size: $(du -sh dist | cut -f1)"
else
    echo "❌ Build failed or incomplete"
    exit 1
fi
`;

  fs.writeFileSync('build-optimized.sh', buildOptScript);
  
  try {
    fs.chmodSync('build-optimized.sh', '755');
    console.log('✅ Generated executable build-optimized.sh');
  } catch (error) {
    console.log('✅ Generated build-optimized.sh (make executable with: chmod +x build-optimized.sh)');
  }
}

function testResourceOptimizations() {
  console.log('🧪 Testing Resource Optimizations...\n');
  
  try {
    console.log('Testing optimized build...');
    const startTime = Date.now();
    
    // Clean build
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // Set optimization environment variables
    process.env.NODE_OPTIONS = '--max-old-space-size=2048';
    process.env.NPM_CONFIG_PREFER_OFFLINE = 'true';
    
    execSync('npm run build', { stdio: 'pipe' });
    
    const buildTime = Date.now() - startTime;
    console.log(`✅ Build completed in ${Math.round(buildTime / 1000)}s`);
    
    // Check build outputs
    const serverSize = fs.existsSync('dist/index.js') ? fs.statSync('dist/index.js').size : 0;
    const clientSize = fs.existsSync('dist/public') ? getDirectorySize('dist/public') : 0;
    
    console.log(`📊 Optimized build results:`);
    console.log(`   Server bundle: ${Math.round(serverSize / 1024)}KB`);
    console.log(`   Client bundle: ${Math.round(clientSize / 1024)}KB`);
    console.log(`   Build time: ${Math.round(buildTime / 1000)}s`);
    
    return { 
      success: true, 
      buildTime, 
      serverSize, 
      clientSize,
      totalSize: serverSize + clientSize 
    };
    
  } catch (error) {
    console.log(`❌ Optimized build failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main execution
function main() {
  console.log('🚀 TeleShop Bot Resource Optimization Analysis\n');
  
  const analysis = analyzeResourceUsage();
  const recommendations = generateOptimizationRecommendations(analysis);
  
  generateOptimizedConfigurations();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  const testResults = testResourceOptimizations();
  
  console.log('\n📊 Resource Optimization Summary:');
  console.log(`   Dependencies: ${analysis.dependencies.issues.length} optimizable`);
  console.log(`   Build complexity: ${analysis.buildComplexity.assessment}`);
  console.log(`   Bundle size: ${analysis.bundleSize.sizeAssessment}`);
  console.log(`   Memory usage: ${analysis.memoryUsage.buildMemoryMB}MB estimated`);
  
  if (testResults.success) {
    console.log(`   Build performance: ${Math.round(testResults.buildTime / 1000)}s`);
    console.log(`   Total bundle: ${Math.round(testResults.totalSize / 1024)}KB`);
  }
  
  console.log('\n🎯 Platform Readiness:');
  Object.entries(PLATFORM_LIMITS).forEach(([platform, limits]) => {
    const memoryStatus = analysis.memoryUsage.platformCompatibility[platform];
    const icon = memoryStatus === 'compatible' ? '✅' : '⚠️';
    console.log(`   ${icon} ${limits.name}: ${memoryStatus}`);
  });
  
  console.log('\n📄 Generated optimization files:');
  console.log('   • railway.optimized.toml');
  console.log('   • vercel.optimized.json');
  console.log('   • Dockerfile.optimized');
  console.log('   • build-optimized.sh');
  
  return { analysis, recommendations, testResults };
}

main();