#!/usr/bin/env node

/**
 * Comprehensive Deployment Readiness Checker
 * Validates all requirements for cross-platform deployment
 */

import fs from 'fs';
import { execSync } from 'child_process';

const REQUIRED_FILES = [
  'package.json',
  'Dockerfile',
  '.env.example',
  'server/index.ts',
  'client/src/App.tsx'
];

const DEPLOYMENT_REQUIREMENTS = {
  common: {
    files: ['package.json', 'server/index.ts', 'shared/schema.ts'],
    envVars: ['TELEGRAM_BOT_TOKEN'],
    ports: ['5000'],
    healthCheck: '/api/bot/status'
  },
  
  railway: {
    files: ['railway.toml'],
    envVars: ['TELEGRAM_BOT_TOKEN', 'NODE_ENV', 'WEBHOOK_URL'],
    mode: 'webhook',
    database: 'optional'
  },
  
  vercel: {
    files: ['vercel.json'],
    envVars: ['TELEGRAM_BOT_TOKEN', 'NODE_ENV', 'WEBHOOK_URL'],
    mode: 'webhook',
    serverless: true
  },
  
  docker: {
    files: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
    envVars: ['TELEGRAM_BOT_TOKEN'],
    mode: 'flexible',
    database: 'container'
  }
};

function checkFileExists(filepath) {
  try {
    fs.accessSync(filepath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function checkPackageJson() {
  const issues = [];
  const recommendations = [];
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required fields
    if (!pkg.name) issues.push('Missing "name" field');
    if (!pkg.version) issues.push('Missing "version" field');
    if (!pkg.type || pkg.type !== 'module') {
      recommendations.push('Consider using "type": "module" for ES modules');
    }
    
    // Check engines field
    if (!pkg.engines) {
      recommendations.push('Add "engines" field to specify Node.js version');
    } else {
      if (!pkg.engines.node) recommendations.push('Specify Node.js version in engines');
    }
    
    // Check scripts
    const requiredScripts = ['dev', 'build', 'start'];
    requiredScripts.forEach(script => {
      if (!pkg.scripts || !pkg.scripts[script]) {
        issues.push(`Missing "${script}" script`);
      }
    });
    
    // Check dependencies
    const criticalDeps = ['express', 'node-telegram-bot-api'];
    criticalDeps.forEach(dep => {
      if (!pkg.dependencies || !pkg.dependencies[dep]) {
        issues.push(`Missing critical dependency: ${dep}`);
      }
    });
    
    return { issues, recommendations, valid: issues.length === 0 };
    
  } catch (error) {
    return { 
      issues: [`Cannot read package.json: ${error.message}`], 
      recommendations: [], 
      valid: false 
    };
  }
}

function checkEnvironmentSetup() {
  const issues = [];
  const warnings = [];
  
  // Check for environment files
  if (!checkFileExists('.env.example')) {
    issues.push('Missing .env.example file for environment documentation');
  }
  
  // Check current environment
  const requiredVars = ['TELEGRAM_BOT_TOKEN'];
  const productionVars = ['NODE_ENV', 'WEBHOOK_URL'];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    productionVars.forEach(varName => {
      if (!process.env[varName]) {
        warnings.push(`Production environment missing: ${varName}`);
      }
    });
  }
  
  return { issues, warnings, valid: issues.length === 0 };
}

function checkBuildConfiguration() {
  const issues = [];
  const warnings = [];
  
  // Check TypeScript configuration
  if (!checkFileExists('tsconfig.json')) {
    issues.push('Missing tsconfig.json for TypeScript compilation');
  }
  
  if (!checkFileExists('tsconfig.server.json')) {
    warnings.push('Missing tsconfig.server.json for server build');
  }
  
  // Check Vite configuration
  if (!checkFileExists('vite.config.ts')) {
    issues.push('Missing vite.config.ts for client build');
  }
  
  // Check build outputs can be created
  try {
    if (!checkFileExists('dist')) {
      warnings.push('No dist directory (will be created during build)');
    }
  } catch (error) {
    warnings.push('Cannot check build directory structure');
  }
  
  return { issues, warnings, valid: issues.length === 0 };
}

function checkPlatformReadiness(platform) {
  const requirements = DEPLOYMENT_REQUIREMENTS[platform];
  if (!requirements) {
    return { issues: ['Unknown platform'], valid: false };
  }
  
  const issues = [];
  const warnings = [];
  
  // Check required files
  requirements.files.forEach(file => {
    if (!checkFileExists(file)) {
      issues.push(`Missing required file for ${platform}: ${file}`);
    }
  });
  
  // Check environment variables
  requirements.envVars.forEach(varName => {
    if (!process.env[varName]) {
      if (varName === 'TELEGRAM_BOT_TOKEN') {
        issues.push(`Missing critical environment variable: ${varName}`);
      } else {
        warnings.push(`Missing environment variable for ${platform}: ${varName}`);
      }
    }
  });
  
  // Platform-specific checks
  if (platform === 'vercel' && requirements.serverless) {
    if (!checkFileExists('api') && !checkFileExists('vercel.json')) {
      warnings.push('Vercel serverless deployment needs API directory or vercel.json config');
    }
  }
  
  if (platform === 'docker') {
    if (!checkFileExists('.dockerignore')) {
      warnings.push('Missing .dockerignore file for optimized Docker builds');
    }
  }
  
  return { issues, warnings, valid: issues.length === 0 };
}

function checkSecurityConfiguration() {
  const issues = [];
  const warnings = [];
  
  // Check for sensitive files in git
  if (checkFileExists('.env')) {
    if (!checkFileExists('.gitignore')) {
      issues.push('Environment file exists but no .gitignore found');
    } else {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env')) {
        issues.push('.env file should be added to .gitignore');
      }
    }
  }
  
  // Check webhook security
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    if (process.env.WEBHOOK_URL && !process.env.WEBHOOK_SECRET) {
      warnings.push('Webhook URL configured but no webhook secret for security');
    }
    
    if (process.env.WEBHOOK_URL && !process.env.WEBHOOK_URL.startsWith('https://')) {
      issues.push('Webhook URL should use HTTPS in production');
    }
  }
  
  return { issues, warnings, valid: issues.length === 0 };
}

function generateDeploymentReport() {
  console.log('🚀 TeleShop Bot Deployment Readiness Check\n');
  
  const checks = {
    'Package Configuration': checkPackageJson(),
    'Environment Setup': checkEnvironmentSetup(), 
    'Build Configuration': checkBuildConfiguration(),
    'Security Configuration': checkSecurityConfiguration()
  };
  
  let overallValid = true;
  let totalIssues = 0;
  let totalWarnings = 0;
  
  // Display results for each check
  Object.entries(checks).forEach(([checkName, result]) => {
    const icon = result.valid ? '✅' : '❌';
    console.log(`${icon} ${checkName}`);
    
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
        totalIssues++;
      });
      overallValid = false;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
        totalWarnings++;
      });
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      result.recommendations.forEach(rec => {
        console.log(`   💡 ${rec}`);
      });
    }
    
    console.log('');
  });
  
  // Platform-specific readiness
  console.log('🏗️ Platform-Specific Readiness:\n');
  
  ['railway', 'vercel', 'docker'].forEach(platform => {
    const platformCheck = checkPlatformReadiness(platform);
    const icon = platformCheck.valid ? '✅' : '❌';
    console.log(`${icon} ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
    
    if (platformCheck.issues && platformCheck.issues.length > 0) {
      platformCheck.issues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
    }
    
    if (platformCheck.warnings && platformCheck.warnings.length > 0) {
      platformCheck.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }
  });
  
  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Issues: ${totalIssues}`);
  console.log(`   Warnings: ${totalWarnings}`);
  
  if (overallValid && totalIssues === 0) {
    console.log('\n🎉 Your application is ready for deployment!');
    console.log('   Run platform-specific setup: node scripts/platform-setup.js setup <platform>');
  } else {
    console.log('\n🔧 Please resolve the issues above before deployment.');
  }
  
  return { valid: overallValid && totalIssues === 0, issues: totalIssues, warnings: totalWarnings };
}

function fixCommonIssues() {
  console.log('🔧 Attempting to fix common deployment issues...\n');
  
  const fixes = [];
  
  // Add engines to package.json if missing
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!pkg.engines) {
      pkg.engines = {
        node: '>=18.0.0',
        npm: '>=9.0.0'
      };
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      fixes.push('Added engines field to package.json');
    }
  } catch (error) {
    console.log('❌ Could not fix package.json:', error.message);
  }
  
  // Create .gitignore if missing
  if (!checkFileExists('.gitignore')) {
    const gitignoreContent = `node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
coverage/
.nyc_output/
`;
    fs.writeFileSync('.gitignore', gitignoreContent);
    fixes.push('Created .gitignore file');
  }
  
  // Create .dockerignore if missing
  if (!checkFileExists('.dockerignore')) {
    const dockerignoreContent = `node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
Dockerfile
.dockerignore
coverage
.nyc_output
.cache
dist
.replit
.upm
`;
    fs.writeFileSync('.dockerignore', dockerignoreContent);
    fixes.push('Created .dockerignore file');
  }
  
  if (fixes.length > 0) {
    console.log('✅ Fixed issues:');
    fixes.forEach(fix => console.log(`   • ${fix}`));
  } else {
    console.log('ℹ️  No common issues found to fix automatically');
  }
  
  console.log('\n🔄 Run deployment check again to verify fixes');
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'check':
    generateDeploymentReport();
    break;
    
  case 'fix':
    fixCommonIssues();
    break;
    
  case 'platform':
    const platform = process.argv[3];
    if (!platform) {
      console.log('Usage: node deployment-check.js platform <platform>');
      process.exit(1);
    }
    const result = checkPlatformReadiness(platform);
    console.log(`\n${platform.charAt(0).toUpperCase() + platform.slice(1)} Deployment Check:`);
    if (result.valid) {
      console.log('✅ Ready for deployment');
    } else {
      console.log('❌ Issues found:');
      result.issues?.forEach(issue => console.log(`   • ${issue}`));
    }
    break;
    
  default:
    console.log('TeleShop Bot Deployment Readiness Checker\n');
    console.log('Commands:');
    console.log('  check              - Full deployment readiness check');
    console.log('  fix                - Automatically fix common issues');
    console.log('  platform <name>    - Check specific platform readiness');
    console.log('\nPlatforms: railway, vercel, docker');
}