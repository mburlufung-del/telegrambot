#!/usr/bin/env node

/**
 * Package Compatibility Checker for Cross-Platform Deployment
 * Validates package.json against platform-specific requirements
 */

import fs from 'fs';
import { execSync } from 'child_process';

const PLATFORM_CONSTRAINTS = {
  railway: {
    name: 'Railway',
    nodeVersions: ['16.x', '18.x', '20.x'],
    buildTimeout: '10 minutes',
    memoryLimit: '8GB',
    restrictions: {
      nativeModules: 'supported',
      buildTools: true,
      pythonRequired: false
    },
    problematicPackages: [
      'puppeteer', // Large size
      'electron', // Desktop app framework
      'node-gyp' // May need build tools
    ],
    recommendations: {
      'sharp': 'Use pre-built binaries',
      'canvas': 'May require additional system dependencies',
      'sqlite3': 'Use @neondatabase/serverless instead'
    }
  },

  vercel: {
    name: 'Vercel',
    nodeVersions: ['18.x', '20.x'],
    buildTimeout: '45 minutes',
    functionSize: '50MB',
    restrictions: {
      nativeModules: 'limited',
      filesystem: 'read-only',
      serverless: true
    },
    problematicPackages: [
      'sharp', // Large binary
      'puppeteer', // Too large for serverless
      'canvas', // Native dependencies
      'sqlite3' // File system dependencies
    ],
    recommendations: {
      'sharp': 'Use @vercel/edge or lighter alternatives',
      'database': 'Use external database services',
      'file-upload': 'Use external storage services'
    }
  },

  docker: {
    name: 'Docker',
    nodeVersions: ['16.x', '18.x', '20.x'],
    baseImages: ['alpine', 'debian', 'ubuntu'],
    restrictions: {
      nativeModules: 'supported',
      buildTools: 'configurable',
      imageSize: 'consider optimization'
    },
    problematicPackages: [],
    recommendations: {
      'alpine': 'Smaller image size but may need additional packages',
      'debian': 'Better compatibility but larger size',
      'multi-stage': 'Use multi-stage builds for production'
    }
  },

  replit: {
    name: 'Replit',
    nodeVersions: ['18.x'],
    diskSpace: 'limited',
    restrictions: {
      nativeModules: 'limited',
      buildTools: 'limited',
      persistence: 'development-only'
    },
    problematicPackages: [
      'puppeteer', // Large size + dependencies
      'sharp', // May need compilation
      'canvas' // Native dependencies
    ],
    recommendations: {
      'lightweight': 'Prefer lightweight alternatives',
      'pre-compiled': 'Use packages with pre-compiled binaries'
    }
  }
};

const ALTERNATIVE_PACKAGES = {
  'bcrypt': {
    alternative: 'bcryptjs',
    reason: 'Pure JavaScript implementation, no native compilation',
    platforms: ['vercel', 'replit']
  },
  'sharp': {
    alternative: 'jimp',
    reason: 'Pure JavaScript image processing',
    platforms: ['vercel', 'replit']
  },
  'sqlite3': {
    alternative: '@neondatabase/serverless',
    reason: 'Serverless-compatible database',
    platforms: ['vercel', 'railway']
  },
  'node-sass': {
    alternative: 'sass',
    reason: 'Pure JavaScript Sass compiler',
    platforms: ['all']
  },
  'puppeteer': {
    alternative: 'playwright-core',
    reason: 'Smaller footprint, better serverless support',
    platforms: ['vercel']
  }
};

function analyzePackageCompatibility(platform) {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  if (!constraints) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    const analysis = {
      compatible: [],
      issues: [],
      warnings: [],
      recommendations: [],
      alternatives: []
    };

    // Check problematic packages
    constraints.problematicPackages.forEach(problematicPkg => {
      if (allDeps[problematicPkg]) {
        analysis.issues.push({
          package: problematicPkg,
          issue: `May cause issues on ${constraints.name}`,
          severity: 'high',
          platform: platform
        });

        // Check if alternative exists
        if (ALTERNATIVE_PACKAGES[problematicPkg]) {
          const alt = ALTERNATIVE_PACKAGES[problematicPkg];
          if (alt.platforms.includes(platform) || alt.platforms.includes('all')) {
            analysis.alternatives.push({
              original: problematicPkg,
              alternative: alt.alternative,
              reason: alt.reason
            });
          }
        }
      }
    });

    // Check Node.js version compatibility
    if (pkg.engines && pkg.engines.node) {
      const specifiedVersion = pkg.engines.node;
      const isCompatible = constraints.nodeVersions.some(supported => {
        return specifiedVersion.includes(supported.replace('.x', ''));
      });
      
      if (!isCompatible) {
        analysis.warnings.push({
          package: 'engines.node',
          issue: `Specified Node.js version may not be supported on ${constraints.name}`,
          recommended: `Use one of: ${constraints.nodeVersions.join(', ')}`,
          severity: 'medium'
        });
      }
    }

    // Platform-specific recommendations
    Object.entries(constraints.recommendations).forEach(([pkg, recommendation]) => {
      if (allDeps[pkg]) {
        analysis.recommendations.push({
          package: pkg,
          recommendation: recommendation,
          platform: platform
        });
      }
    });

    // Check for large dependencies (size estimation)
    const largeDependencies = [
      'puppeteer', 'electron', 'sharp', '@tensorflow/tfjs-node',
      'canvas', 'sqlite3', 'fsevents'
    ];

    largeDependencies.forEach(largeDep => {
      if (allDeps[largeDep]) {
        if (platform === 'vercel' && constraints.functionSize) {
          analysis.warnings.push({
            package: largeDep,
            issue: `Large dependency may exceed Vercel's ${constraints.functionSize} function size limit`,
            severity: 'medium'
          });
        }
        if (platform === 'replit') {
          analysis.warnings.push({
            package: largeDep,
            issue: 'Large dependency may impact Replit startup time',
            severity: 'low'
          });
        }
      }
    });

    return analysis;

  } catch (error) {
    return {
      issues: [{
        package: 'package.json',
        issue: `Cannot read package.json: ${error.message}`,
        severity: 'critical'
      }]
    };
  }
}

function generateCompatibilityReport(platform) {
  console.log(`🔍 Package Compatibility Analysis for ${PLATFORM_CONSTRAINTS[platform]?.name || platform}\n`);

  const analysis = analyzePackageCompatibility(platform);
  const constraints = PLATFORM_CONSTRAINTS[platform];

  // Platform overview
  console.log('🏗️ Platform Overview:');
  console.log(`   Supported Node.js: ${constraints.nodeVersions.join(', ')}`);
  if (constraints.buildTimeout) {
    console.log(`   Build Timeout: ${constraints.buildTimeout}`);
  }
  if (constraints.functionSize) {
    console.log(`   Function Size Limit: ${constraints.functionSize}`);
  }
  if (constraints.memoryLimit) {
    console.log(`   Memory Limit: ${constraints.memoryLimit}`);
  }
  console.log('');

  // Issues
  if (analysis.issues && analysis.issues.length > 0) {
    console.log('❌ Compatibility Issues:');
    analysis.issues.forEach(issue => {
      console.log(`   ❌ ${issue.package}: ${issue.issue}`);
    });
    console.log('');
  }

  // Warnings
  if (analysis.warnings && analysis.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    analysis.warnings.forEach(warning => {
      console.log(`   ⚠️ ${warning.package}: ${warning.issue}`);
      if (warning.recommended) {
        console.log(`      💡 Recommended: ${warning.recommended}`);
      }
    });
    console.log('');
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    console.log('💡 Platform-Specific Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`   💡 ${rec.package}: ${rec.recommendation}`);
    });
    console.log('');
  }

  // Alternatives
  if (analysis.alternatives && analysis.alternatives.length > 0) {
    console.log('🔄 Suggested Alternatives:');
    analysis.alternatives.forEach(alt => {
      console.log(`   🔄 Replace ${alt.original} with ${alt.alternative}`);
      console.log(`      Reason: ${alt.reason}`);
    });
    console.log('');
  }

  // Summary
  const totalIssues = (analysis.issues?.length || 0);
  const totalWarnings = (analysis.warnings?.length || 0);

  console.log('📊 Summary:');
  console.log(`   Critical Issues: ${totalIssues}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalIssues === 0) {
    console.log(`\n✅ Package configuration is compatible with ${constraints.name}`);
  } else {
    console.log(`\n🔧 Address issues above for optimal ${constraints.name} deployment`);
  }

  return analysis;
}

function generateOptimizedPackageJson(platform) {
  console.log(`📦 Generating ${platform}-optimized package.json...\n`);

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const analysis = analyzePackageCompatibility(platform);
    const constraints = PLATFORM_CONSTRAINTS[platform];

    let modified = false;

    // Apply alternatives for problematic packages
    if (analysis.alternatives) {
      analysis.alternatives.forEach(alt => {
        if (pkg.dependencies[alt.original]) {
          console.log(`🔄 Replacing ${alt.original} with ${alt.alternative}`);
          delete pkg.dependencies[alt.original];
          pkg.dependencies[alt.alternative] = 'latest'; // Use latest for alternatives
          modified = true;
        }
      });
    }

    // Optimize engines field for platform
    if (!pkg.engines) pkg.engines = {};
    
    const recommendedNode = constraints.nodeVersions[0]; // Use first supported version
    pkg.engines.node = `>=${recommendedNode.replace('.x', '.0')}`;
    pkg.engines.npm = '>=9.0.0';

    // Platform-specific optimizations
    if (platform === 'vercel') {
      // Add Vercel-specific configurations
      if (!pkg.scripts.vercel) {
        pkg.scripts['vercel-build'] = 'npm run build';
        modified = true;
      }
    }

    if (platform === 'railway') {
      // Ensure start script exists
      if (!pkg.scripts.start) {
        pkg.scripts.start = 'npm run start';
        modified = true;
      }
    }

    if (platform === 'docker') {
      // Add Docker-friendly scripts
      if (!pkg.scripts['docker:build']) {
        pkg.scripts['docker:build'] = 'docker build -t teleshop-bot .';
        pkg.scripts['docker:run'] = 'docker run -p 5000:5000 teleshop-bot';
        modified = true;
      }
    }

    // Write optimized package.json
    const filename = `package.${platform}.json`;
    fs.writeFileSync(filename, JSON.stringify(pkg, null, 2));
    
    console.log(`✅ Generated ${filename}`);
    if (modified) {
      console.log('📋 Changes made:');
      if (analysis.alternatives) {
        analysis.alternatives.forEach(alt => {
          console.log(`   • Replaced ${alt.original} → ${alt.alternative}`);
        });
      }
      console.log(`   • Optimized engines for ${constraints.name}`);
    }

  } catch (error) {
    console.log(`❌ Error generating optimized package.json: ${error.message}`);
  }
}

function generateInstallScript(platform) {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  
  const scripts = [
    '#!/bin/bash',
    `# ${constraints.name} Deployment Installation Script`,
    '',
    'echo "📦 Installing dependencies for ' + constraints.name + '..."',
    '',
    '# Clean install',
    'rm -rf node_modules package-lock.json',
    'npm cache clean --force',
    '',
    '# Install with platform-specific optimizations'
  ];

  if (platform === 'railway') {
    scripts.push('# Railway supports native modules');
    scripts.push('npm ci --production=false');
  } else if (platform === 'vercel') {
    scripts.push('# Vercel optimized install');
    scripts.push('npm ci --production=false --prefer-offline');
  } else if (platform === 'docker') {
    scripts.push('# Docker optimized install');
    scripts.push('npm ci --only=production');
  } else {
    scripts.push('npm ci');
  }

  scripts.push('');
  scripts.push('echo "✅ Dependencies installed successfully"');

  const filename = `install-${platform}.sh`;
  fs.writeFileSync(filename, scripts.join('\n'));
  
  // Make script executable
  try {
    execSync(`chmod +x ${filename}`);
  } catch (error) {
    console.log('Note: Run chmod +x ' + filename + ' to make script executable');
  }

  return filename;
}

// CLI interface
const command = process.argv[2];
const platform = process.argv[3];

switch (command) {
  case 'check':
    if (!platform) {
      console.log('Usage: node package-compatibility.js check <platform>');
      console.log('Platforms: railway, vercel, docker, replit');
      process.exit(1);
    }
    generateCompatibilityReport(platform);
    break;

  case 'optimize':
    if (!platform) {
      console.log('Usage: node package-compatibility.js optimize <platform>');
      console.log('Platforms: railway, vercel, docker, replit');
      process.exit(1);
    }
    generateOptimizedPackageJson(platform);
    break;

  case 'install-script':
    if (!platform) {
      console.log('Usage: node package-compatibility.js install-script <platform>');
      console.log('Platforms: railway, vercel, docker, replit');
      process.exit(1);
    }
    const script = generateInstallScript(platform);
    console.log(`✅ Generated installation script: ${script}`);
    break;

  case 'all':
    if (!platform) {
      console.log('Usage: node package-compatibility.js all <platform>');
      console.log('Platforms: railway, vercel, docker, replit');
      process.exit(1);
    }
    console.log('🔍 Complete Package Analysis...\n');
    generateCompatibilityReport(platform);
    console.log('\n' + '='.repeat(60) + '\n');
    generateOptimizedPackageJson(platform);
    console.log('\n' + '='.repeat(60) + '\n');
    const installScript = generateInstallScript(platform);
    console.log(`✅ Generated installation script: ${installScript}`);
    break;

  default:
    console.log('TeleShop Bot Package Compatibility Tool\n');
    console.log('Commands:');
    console.log('  check <platform>          - Analyze package compatibility');
    console.log('  optimize <platform>       - Generate optimized package.json');
    console.log('  install-script <platform> - Generate installation script');
    console.log('  all <platform>            - Run complete analysis and optimization');
    console.log('\nPlatforms: railway, vercel, docker, replit');
}