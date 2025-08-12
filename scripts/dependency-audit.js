#!/usr/bin/env node

/**
 * Dependency Audit Tool for Cross-Platform Compatibility
 * Analyzes and validates dependencies for deployment across platforms
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const PLATFORM_SPECIFIC_DEPS = {
  // Dependencies that may have platform-specific issues
  problematic: [
    'bcrypt', // Native compilation issues
    'sharp', // Platform-specific binaries
    'canvas', // Native dependencies
    'sqlite3', // Native compilation
    'node-gyp' // Build tool dependencies
  ],
  
  // Better alternatives for cross-platform compatibility
  alternatives: {
    'bcrypt': 'bcryptjs',
    'sqlite3': '@neondatabase/serverless',
    'node-sass': 'sass'
  }
};

const RUNTIME_DEPENDENCIES = {
  critical: [
    'express',
    'node-telegram-bot-api',
    'drizzle-orm',
    'react',
    'react-dom'
  ],
  
  development: [
    'typescript',
    'tsx',
    'vite',
    '@types/node',
    '@types/express',
    '@types/react'
  ],
  
  optional: [
    '@neondatabase/serverless',
    'connect-pg-simple',
    'express-session'
  ]
};

const PLATFORM_REQUIREMENTS = {
  replit: {
    name: 'Replit',
    nodeVersion: '18.19.0',
    architecture: 'x64',
    os: 'linux',
    issues: ['Limited disk space', 'No native build tools by default']
  },
  
  railway: {
    name: 'Railway',
    nodeVersion: '18.x',
    architecture: 'x64',
    os: 'linux',
    buildTools: true,
    issues: ['Memory limits during build', 'Build timeout']
  },
  
  vercel: {
    name: 'Vercel',
    nodeVersion: '18.x',
    architecture: 'x64',
    os: 'linux',
    serverless: true,
    buildTools: true,
    limitations: ['Function size limits', 'No persistent filesystem']
  },
  
  docker: {
    name: 'Docker',
    nodeVersion: 'configurable',
    architecture: 'configurable',
    os: 'alpine/debian',
    buildTools: 'configurable',
    issues: ['Image size', 'Build context']
  }
};

function analyzePackageJson() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const analysis = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    // Check for problematic dependencies
    const allDeps = { ...analysis.dependencies, ...analysis.devDependencies };
    
    PLATFORM_SPECIFIC_DEPS.problematic.forEach(dep => {
      if (allDeps[dep]) {
        analysis.issues.push({
          dependency: dep,
          issue: 'May cause cross-platform compatibility issues',
          alternative: PLATFORM_SPECIFIC_DEPS.alternatives[dep],
          severity: 'high'
        });
      }
    });

    // Check for missing critical dependencies
    RUNTIME_DEPENDENCIES.critical.forEach(dep => {
      if (!analysis.dependencies[dep]) {
        analysis.issues.push({
          dependency: dep,
          issue: 'Missing critical runtime dependency',
          severity: 'critical'
        });
      }
    });

    // Check for missing development dependencies
    RUNTIME_DEPENDENCIES.development.forEach(dep => {
      if (!analysis.devDependencies[dep] && !analysis.dependencies[dep]) {
        analysis.warnings.push({
          dependency: dep,
          issue: 'Missing development dependency',
          severity: 'medium'
        });
      }
    });

    // Check version specifications
    Object.entries(allDeps).forEach(([dep, version]) => {
      if (version === '*' || version === 'latest') {
        analysis.warnings.push({
          dependency: dep,
          issue: 'Unpinned version may cause deployment inconsistencies',
          recommendation: 'Use specific version ranges',
          severity: 'medium'
        });
      }
    });

    // Check for duplicate dependencies
    Object.keys(analysis.dependencies).forEach(dep => {
      if (analysis.devDependencies[dep]) {
        analysis.warnings.push({
          dependency: dep,
          issue: 'Dependency exists in both dependencies and devDependencies',
          severity: 'low'
        });
      }
    });

    return analysis;

  } catch (error) {
    return {
      issues: [{ 
        dependency: 'package.json',
        issue: `Cannot read package.json: ${error.message}`,
        severity: 'critical'
      }],
      warnings: [],
      recommendations: []
    };
  }
}

function checkNodeModulesConsistency() {
  const issues = [];
  const warnings = [];

  try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      issues.push({
        issue: 'node_modules directory not found',
        recommendation: 'Run npm install',
        severity: 'high'
      });
      return { issues, warnings };
    }

    // Check package-lock.json
    if (!fs.existsSync('package-lock.json')) {
      warnings.push({
        issue: 'package-lock.json not found',
        recommendation: 'Run npm install to generate lockfile',
        severity: 'medium'
      });
    }

    // Check for security vulnerabilities
    try {
      const auditResult = execSync('npm audit --audit-level=high --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        if (vulns.high > 0 || vulns.critical > 0) {
          issues.push({
            issue: `Found ${vulns.high + vulns.critical} high/critical security vulnerabilities`,
            recommendation: 'Run npm audit fix',
            severity: 'high'
          });
        }
      }
    } catch (auditError) {
      // npm audit may exit with non-zero code if vulnerabilities found
      if (auditError.stdout) {
        try {
          const audit = JSON.parse(auditError.stdout);
          if (audit.metadata && audit.metadata.vulnerabilities) {
            const vulns = audit.metadata.vulnerabilities;
            if (vulns.high > 0 || vulns.critical > 0) {
              issues.push({
                issue: `Found ${vulns.high + vulns.critical} high/critical security vulnerabilities`,
                recommendation: 'Run npm audit fix',
                severity: 'high'
              });
            }
          }
        } catch (parseError) {
          warnings.push({
            issue: 'Could not parse npm audit results',
            severity: 'low'
          });
        }
      }
    }

  } catch (error) {
    warnings.push({
      issue: `Error checking node_modules: ${error.message}`,
      severity: 'medium'
    });
  }

  return { issues, warnings };
}

function generateDependencyReport(platform = null) {
  console.log('🔍 Dependency Compatibility Analysis\n');

  const packageAnalysis = analyzePackageJson();
  const nodeModulesCheck = checkNodeModulesConsistency();

  // Display package.json analysis
  console.log('📦 Package.json Analysis:');
  
  if (packageAnalysis.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    packageAnalysis.issues.forEach(issue => {
      const severity = issue.severity === 'critical' ? '🚨' : 
                      issue.severity === 'high' ? '❌' : '⚠️';
      console.log(`   ${severity} ${issue.dependency}: ${issue.issue}`);
      if (issue.alternative) {
        console.log(`      💡 Consider using: ${issue.alternative}`);
      }
      if (issue.recommendation) {
        console.log(`      💡 ${issue.recommendation}`);
      }
    });
  }

  if (packageAnalysis.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    packageAnalysis.warnings.forEach(warning => {
      console.log(`   ⚠️ ${warning.dependency}: ${warning.issue}`);
      if (warning.recommendation) {
        console.log(`      💡 ${warning.recommendation}`);
      }
    });
  }

  // Display node_modules check
  console.log('\n📁 Installation Analysis:');
  
  if (nodeModulesCheck.issues.length > 0) {
    nodeModulesCheck.issues.forEach(issue => {
      console.log(`   ❌ ${issue.issue}`);
      if (issue.recommendation) {
        console.log(`      💡 ${issue.recommendation}`);
      }
    });
  }

  if (nodeModulesCheck.warnings.length > 0) {
    nodeModulesCheck.warnings.forEach(warning => {
      console.log(`   ⚠️ ${warning.issue}`);
      if (warning.recommendation) {
        console.log(`      💡 ${warning.recommendation}`);
      }
    });
  }

  // Platform-specific analysis
  if (platform && PLATFORM_REQUIREMENTS[platform]) {
    console.log(`\n🏗️ ${PLATFORM_REQUIREMENTS[platform].name} Compatibility:`);
    
    const platformReq = PLATFORM_REQUIREMENTS[platform];
    console.log(`   Node.js: ${platformReq.nodeVersion}`);
    console.log(`   Architecture: ${platformReq.architecture}`);
    console.log(`   OS: ${platformReq.os}`);
    
    if (platformReq.limitations) {
      console.log('   Limitations:');
      platformReq.limitations.forEach(limit => {
        console.log(`     • ${limit}`);
      });
    }
    
    if (platformReq.issues) {
      console.log('   Common Issues:');
      platformReq.issues.forEach(issue => {
        console.log(`     • ${issue}`);
      });
    }
  }

  // Summary
  const totalIssues = packageAnalysis.issues.length + nodeModulesCheck.issues.length;
  const totalWarnings = packageAnalysis.warnings.length + nodeModulesCheck.warnings.length;

  console.log(`\n📊 Summary:`);
  console.log(`   Critical Issues: ${totalIssues}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalIssues === 0) {
    console.log('\n✅ Dependencies are compatible for cross-platform deployment');
  } else {
    console.log('\n🔧 Resolve issues above for optimal deployment compatibility');
  }

  return { 
    issues: totalIssues, 
    warnings: totalWarnings,
    packageAnalysis,
    nodeModulesCheck
  };
}

function fixDependencyIssues() {
  console.log('🔧 Attempting to fix dependency issues...\n');

  const fixes = [];
  const analysis = analyzePackageJson();

  try {
    // Fix package-lock.json if missing
    if (!fs.existsSync('package-lock.json')) {
      console.log('📦 Generating package-lock.json...');
      execSync('npm install --package-lock-only', { stdio: 'inherit' });
      fixes.push('Generated package-lock.json');
    }

    // Try to fix security vulnerabilities
    try {
      console.log('🔒 Checking for security vulnerabilities...');
      execSync('npm audit fix --force', { stdio: 'inherit' });
      fixes.push('Applied security fixes');
    } catch (auditError) {
      console.log('⚠️ Some vulnerabilities may require manual resolution');
    }

    // Update outdated dependencies (with caution)
    try {
      console.log('📈 Checking for outdated dependencies...');
      const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdatedDeps = JSON.parse(outdated || '{}');
      
      if (Object.keys(outdatedDeps).length > 0) {
        console.log('📋 Outdated dependencies found (manual update recommended):');
        Object.entries(outdatedDeps).forEach(([dep, info]) => {
          console.log(`   • ${dep}: ${info.current} → ${info.latest}`);
        });
      }
    } catch (outdatedError) {
      // npm outdated exits with code 1 when outdated packages found
    }

  } catch (error) {
    console.log(`❌ Error during fixes: ${error.message}`);
  }

  if (fixes.length > 0) {
    console.log('\n✅ Applied fixes:');
    fixes.forEach(fix => console.log(`   • ${fix}`));
  } else {
    console.log('ℹ️ No automatic fixes available');
  }

  console.log('\n🔄 Run dependency audit again to verify fixes');
}

function generatePackageJsonOptimized() {
  console.log('📦 Generating optimized package.json...\n');

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add missing engines if not present
    if (!pkg.engines) {
      pkg.engines = {
        node: '>=18.0.0',
        npm: '>=9.0.0'
      };
    }

    // Ensure all critical dependencies are present
    const criticalDeps = {
      'express': '^4.21.2',
      'node-telegram-bot-api': '^0.66.0',
      'drizzle-orm': '^0.39.1',
      'react': '^18.3.1',
      'react-dom': '^18.3.1'
    };

    Object.entries(criticalDeps).forEach(([dep, version]) => {
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = version;
        console.log(`✅ Added missing dependency: ${dep}`);
      }
    });

    // Add recommended development dependencies
    const devDeps = {
      'typescript': '^5.6.0',
      'tsx': '^4.19.0',
      '@types/node': '^22.5.0',
      '@types/express': '^4.17.21'
    };

    if (!pkg.devDependencies) pkg.devDependencies = {};

    Object.entries(devDeps).forEach(([dep, version]) => {
      if (!pkg.devDependencies[dep] && !pkg.dependencies[dep]) {
        pkg.devDependencies[dep] = version;
        console.log(`✅ Added missing dev dependency: ${dep}`);
      }
    });

    // Write optimized package.json
    fs.writeFileSync('package.json.optimized', JSON.stringify(pkg, null, 2));
    console.log('\n📄 Generated package.json.optimized');
    console.log('Review and replace package.json if changes look good');

  } catch (error) {
    console.log(`❌ Error optimizing package.json: ${error.message}`);
  }
}

// CLI interface
const command = process.argv[2];
const platform = process.argv[3];

switch (command) {
  case 'audit':
    generateDependencyReport(platform);
    break;
    
  case 'fix':
    fixDependencyIssues();
    break;
    
  case 'optimize':
    generatePackageJsonOptimized();
    break;
    
  case 'platform':
    if (!platform) {
      console.log('Usage: node dependency-audit.js platform <platform>');
      console.log('Platforms: replit, railway, vercel, docker');
      process.exit(1);
    }
    generateDependencyReport(platform);
    break;
    
  default:
    console.log('TeleShop Bot Dependency Audit Tool\n');
    console.log('Commands:');
    console.log('  audit [platform]       - Analyze dependencies for compatibility');
    console.log('  fix                     - Automatically fix dependency issues');
    console.log('  optimize                - Generate optimized package.json');
    console.log('  platform <name>         - Platform-specific dependency analysis');
    console.log('\nPlatforms: replit, railway, vercel, docker');
}