#!/usr/bin/env node

/**
 * Runtime Version Checker for Cross-Platform Compatibility
 * Ensures consistent runtime versions across different platforms
 */

import fs from 'fs';
import { execSync } from 'child_process';

const RECOMMENDED_VERSIONS = {
  node: {
    min: '18.0.0',
    recommended: '18.19.0',
    max: '20.x.x'
  },
  npm: {
    min: '9.0.0',
    recommended: '10.2.0'
  }
};

const PLATFORM_REQUIREMENTS = {
  replit: {
    name: 'Replit',
    node: '18.19.0',
    notes: ['Replit provides Node.js 18.x by default', 'No additional configuration needed']
  },
  railway: {
    name: 'Railway',
    node: '18.x.x',
    notes: [
      'Railway auto-detects Node.js version from package.json',
      'Add "engines" field to package.json to specify version',
      'Supports Node.js 16.x, 18.x, and 20.x'
    ]
  },
  vercel: {
    name: 'Vercel',
    node: '18.x',
    notes: [
      'Vercel supports Node.js 18.x in runtime',
      'Specify version in vercel.json functions config',
      'Automatically uses latest LTS if not specified'
    ]
  },
  docker: {
    name: 'Docker',
    node: 'Configurable',
    notes: [
      'Use node:18-alpine for consistency',
      'Explicitly specify version in Dockerfile',
      'Keep base image updated for security'
    ]
  }
};

function getCurrentVersions() {
  try {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    return {
      node: nodeVersion.replace('v', ''),
      npm: npmVersion
    };
  } catch (error) {
    console.error('Error getting current versions:', error.message);
    return null;
  }
}

function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(n => parseInt(n));
  const v2parts = version2.split('.').map(n => parseInt(n));
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
}

function checkVersionCompatibility(current, recommended) {
  const isMinMet = compareVersions(current, recommended.min) >= 0;
  const isRecommended = compareVersions(current, recommended.recommended) >= 0;
  
  let status = 'unknown';
  let message = '';
  
  if (!isMinMet) {
    status = 'error';
    message = `Version ${current} is below minimum ${recommended.min}`;
  } else if (!isRecommended) {
    status = 'warning';
    message = `Version ${current} works but ${recommended.recommended} is recommended`;
  } else {
    status = 'good';
    message = `Version ${current} is compatible`;
  }
  
  return { status, message, isMinMet, isRecommended };
}

function generatePackageJsonEngines() {
  return {
    engines: {
      node: `>=${RECOMMENDED_VERSIONS.node.min}`,
      npm: `>=${RECOMMENDED_VERSIONS.npm.min}`
    }
  };
}

function updatePackageJson() {
  try {
    const packagePath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add engines field if not present
    if (!packageJson.engines) {
      packageJson.engines = generatePackageJsonEngines().engines;
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added engines field to package.json');
      return true;
    } else {
      console.log('📋 Engines field already exists in package.json');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    return false;
  }
}

function generateDockerfile() {
  const dockerfile = `# Multi-stage build for production
FROM node:${RECOMMENDED_VERSIONS.node.recommended}-alpine as base

# Install curl for healthchecks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base as dependencies
RUN npm ci --only=production

# Build stage
FROM base as build
COPY . .
RUN npm ci
RUN npm run build

# Production stage
FROM dependencies as production
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S teleshop -u 1001

# Change ownership
RUN chown -R teleshop:nodejs /app
USER teleshop

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/api/bot/status || exit 1

# Start application
CMD ["npm", "start"]
`;

  fs.writeFileSync('Dockerfile.optimized', dockerfile);
  console.log('📄 Generated optimized Dockerfile with Node.js', RECOMMENDED_VERSIONS.node.recommended);
}

function checkRuntimeCompatibility() {
  console.log('🔍 Runtime Version Compatibility Check\n');
  
  const current = getCurrentVersions();
  if (!current) {
    console.log('❌ Unable to detect current runtime versions');
    return false;
  }
  
  console.log('📋 Current Versions:');
  console.log(`  Node.js: ${current.node}`);
  console.log(`  npm: ${current.npm}\n`);
  
  // Check Node.js compatibility
  const nodeCheck = checkVersionCompatibility(current.node, RECOMMENDED_VERSIONS.node);
  const nodeIcon = nodeCheck.status === 'good' ? '✅' : nodeCheck.status === 'warning' ? '⚠️' : '❌';
  console.log(`${nodeIcon} Node.js: ${nodeCheck.message}`);
  
  // Check npm compatibility
  const npmCheck = checkVersionCompatibility(current.npm, RECOMMENDED_VERSIONS.npm);
  const npmIcon = npmCheck.status === 'good' ? '✅' : npmCheck.status === 'warning' ? '⚠️' : '❌';
  console.log(`${npmIcon} npm: ${npmCheck.message}\n`);
  
  // Platform-specific recommendations
  console.log('🏗️ Platform Compatibility:');
  Object.entries(PLATFORM_REQUIREMENTS).forEach(([key, platform]) => {
    console.log(`\n  ${platform.name}:`);
    console.log(`    Node.js: ${platform.node}`);
    platform.notes.forEach(note => {
      console.log(`    • ${note}`);
    });
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!nodeCheck.isMinMet) {
    console.log('  ❗ Upgrade Node.js to at least', RECOMMENDED_VERSIONS.node.min);
  }
  if (!npmCheck.isMinMet) {
    console.log('  ❗ Upgrade npm to at least', RECOMMENDED_VERSIONS.npm.min);
  }
  if (nodeCheck.isMinMet && npmCheck.isMinMet) {
    console.log('  ✅ Your runtime versions are compatible');
    console.log('  📦 Consider adding engines field to package.json for consistency');
  }
  
  return nodeCheck.isMinMet && npmCheck.isMinMet;
}

function showPlatformSpecificInstructions(platform) {
  const config = PLATFORM_REQUIREMENTS[platform];
  if (!config) {
    console.log('❌ Unknown platform. Supported: replit, railway, vercel, docker');
    return;
  }
  
  console.log(`\n🚀 ${config.name} Deployment Instructions:\n`);
  
  if (platform === 'railway') {
    console.log('1. Add engines to package.json:');
    console.log('   {');
    console.log('     "engines": {');
    console.log(`       "node": ">=${RECOMMENDED_VERSIONS.node.min}"`);
    console.log('     }');
    console.log('   }');
    console.log('\n2. Railway will automatically use the specified version');
    console.log('3. Check build logs to verify Node.js version');
  }
  
  if (platform === 'vercel') {
    console.log('1. Vercel uses Node.js 18.x by default');
    console.log('2. No additional configuration needed');
    console.log('3. Functions run in serverless environment');
  }
  
  if (platform === 'docker') {
    console.log('1. Use the generated Dockerfile.optimized');
    console.log(`2. Based on node:${RECOMMENDED_VERSIONS.node.recommended}-alpine`);
    console.log('3. Multi-stage build for optimized production image');
  }
  
  if (platform === 'replit') {
    console.log('1. Replit automatically provides Node.js 18.x');
    console.log('2. No version configuration needed');
    console.log('3. Runtime is managed by Replit platform');
  }
  
  console.log('\n✅ Platform instructions completed!');
}

// CLI interface
const command = process.argv[2];
const platform = process.argv[3];

switch (command) {
  case 'check':
    checkRuntimeCompatibility();
    break;
    
  case 'update-package':
    updatePackageJson();
    break;
    
  case 'dockerfile':
    generateDockerfile();
    break;
    
  case 'platform':
    if (!platform) {
      console.log('Usage: node runtime-check.js platform <platform>');
      console.log('Platforms: replit, railway, vercel, docker');
      process.exit(1);
    }
    showPlatformSpecificInstructions(platform);
    break;
    
  default:
    console.log('TeleShop Bot Runtime Compatibility Checker\n');
    console.log('Commands:');
    console.log('  check              - Check current runtime versions');
    console.log('  update-package     - Add engines field to package.json');
    console.log('  dockerfile         - Generate optimized Dockerfile');
    console.log('  platform <name>    - Show platform-specific instructions');
    console.log('\nPlatforms: replit, railway, vercel, docker');
}