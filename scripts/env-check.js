#!/usr/bin/env node

/**
 * Environment Variable Checker for Cross-Platform Deployment
 * Validates required environment variables and provides migration help
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_VARS = {
  // Core application variables
  NODE_ENV: {
    description: 'Application environment',
    default: 'development',
    values: ['development', 'production', 'test']
  },
  PORT: {
    description: 'Server port',
    default: '5000',
    type: 'number'
  },
  
  // Telegram bot configuration
  TELEGRAM_BOT_TOKEN: {
    description: 'Telegram bot token from @BotFather',
    required: true,
    sensitive: true
  },
  
  // Production webhook settings
  WEBHOOK_URL: {
    description: 'Webhook URL for production deployment',
    required: false,
    example: 'https://your-app.railway.app/webhook'
  },
  WEBHOOK_SECRET: {
    description: 'Secret token for webhook security',
    required: false,
    sensitive: true
  },
  
  // Database configuration
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    required: false,
    example: 'postgresql://user:pass@host:port/database'
  }
};

const PLATFORM_CONFIGS = {
  replit: {
    name: 'Replit',
    envFile: '.env',
    secretsLocation: 'Secrets tab in Replit dashboard',
    instructions: [
      '1. Go to your Replit project',
      '2. Click on "Secrets" tab (lock icon)',
      '3. Add each environment variable as a secret',
      '4. Restart your Repl'
    ]
  },
  railway: {
    name: 'Railway',
    envFile: 'Railway Dashboard > Variables',
    secretsLocation: 'Railway dashboard environment variables',
    instructions: [
      '1. Go to Railway dashboard',
      '2. Select your project',
      '3. Go to Variables tab',
      '4. Add each environment variable',
      '5. Deploy your application'
    ]
  },
  vercel: {
    name: 'Vercel',
    envFile: 'vercel.json or dashboard',
    secretsLocation: 'Vercel dashboard environment variables',
    instructions: [
      '1. Go to Vercel dashboard',
      '2. Select your project',
      '3. Go to Settings > Environment Variables',
      '4. Add each variable for Production environment',
      '5. Redeploy your application'
    ]
  },
  docker: {
    name: 'Docker',
    envFile: '.env or docker-compose.yml',
    secretsLocation: 'Environment file or compose file',
    instructions: [
      '1. Create .env file in project root',
      '2. Add environment variables (see .env.example)',
      '3. Use docker-compose up or docker run with --env-file',
      '4. Ensure .env is in .gitignore'
    ]
  }
};

function checkEnvironment() {
  console.log('🔍 Environment Variable Checker\n');
  
  const missing = [];
  const warnings = [];
  const current = {};
  
  // Check each required variable
  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    current[key] = value ? (config.sensitive ? '[HIDDEN]' : value) : undefined;
    
    if (config.required && !value) {
      missing.push({
        key,
        ...config
      });
    } else if (!value && config.default) {
      warnings.push({
        key,
        message: `Using default value: ${config.default}`,
        ...config
      });
    }
  });
  
  // Display current environment
  console.log('📋 Current Environment Variables:');
  Object.entries(current).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${value || 'Not set'}`);
  });
  
  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => {
      console.log(`  • ${warning.key}: ${warning.message}`);
    });
  }
  
  // Display missing variables
  if (missing.length > 0) {
    console.log('\n❌ Missing Required Variables:');
    missing.forEach(item => {
      console.log(`  • ${item.key}: ${item.description}`);
      if (item.example) {
        console.log(`    Example: ${item.example}`);
      }
    });
    return false;
  }
  
  // Environment-specific checks
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`\n🏗️  Environment: ${nodeEnv}`);
  
  if (nodeEnv === 'production') {
    const productionWarnings = [];
    
    if (!process.env.WEBHOOK_URL && process.env.TELEGRAM_BOT_TOKEN) {
      productionWarnings.push('Consider using WEBHOOK_URL for production deployments');
    }
    
    if (!process.env.DATABASE_URL) {
      productionWarnings.push('Using in-memory storage (data will be lost on restart)');
    }
    
    if (productionWarnings.length > 0) {
      console.log('\n🔔 Production Recommendations:');
      productionWarnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
  }
  
  console.log('\n✅ Environment check completed successfully!');
  return true;
}

function generateMigrationGuide(fromPlatform, toPlatform) {
  const from = PLATFORM_CONFIGS[fromPlatform];
  const to = PLATFORM_CONFIGS[toPlatform];
  
  if (!from || !to) {
    console.log('❌ Unknown platform. Supported: replit, railway, vercel, docker');
    return;
  }
  
  console.log(`\n📦 Migration Guide: ${from.name} → ${to.name}\n`);
  
  // Step 1: Export from source
  console.log(`1️⃣ Export from ${from.name}:`);
  if (fromPlatform === 'replit') {
    console.log('   • Copy values from Secrets tab');
    console.log('   • Note: Replit secrets are only visible in the dashboard');
  } else {
    console.log(`   • Export environment variables from ${from.envFile}`);
  }
  
  // Step 2: Required variables
  console.log('\n2️⃣ Required Variables to Transfer:');
  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const required = config.required ? '(Required)' : '(Optional)';
    console.log(`   • ${key} ${required}: ${config.description}`);
  });
  
  // Step 3: Import to destination
  console.log(`\n3️⃣ Import to ${to.name}:`);
  to.instructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
  
  // Step 4: Platform-specific notes
  console.log('\n4️⃣ Platform-Specific Notes:');
  
  if (toPlatform === 'railway') {
    console.log('   • Railway automatically detects Node.js and installs dependencies');
    console.log('   • Set NODE_ENV=production for webhook mode');
    console.log('   • WEBHOOK_URL should be https://your-app.railway.app/webhook');
  }
  
  if (toPlatform === 'vercel') {
    console.log('   • Vercel only supports webhook mode (serverless)');
    console.log('   • WEBHOOK_URL should be https://your-app.vercel.app/webhook');
    console.log('   • Function timeout is limited to 30 seconds');
  }
  
  if (toPlatform === 'docker') {
    console.log('   • Use .env file for local development');
    console.log('   • Use docker-compose.yml for production');
    console.log('   • Ensure sensitive data is not in version control');
  }
  
  console.log('\n✅ Migration guide completed!');
}

function createEnvTemplate(platform = 'general') {
  const template = [];
  template.push('# TeleShop Bot Environment Configuration');
  template.push(`# Generated for: ${PLATFORM_CONFIGS[platform]?.name || 'General'}`);
  template.push('# Copy this to .env and fill in your values\n');
  
  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    template.push(`# ${config.description}`);
    if (config.required) {
      template.push(`${key}=`);
    } else {
      template.push(`# ${key}=${config.default || config.example || ''}`);
    }
    template.push('');
  });
  
  const filename = `.env.${platform}`;
  fs.writeFileSync(filename, template.join('\n'));
  console.log(`📄 Environment template created: ${filename}`);
}

// CLI interface
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'check':
    checkEnvironment();
    break;
    
  case 'migrate':
    if (!arg1 || !arg2) {
      console.log('Usage: node env-check.js migrate <from> <to>');
      console.log('Platforms: replit, railway, vercel, docker');
      process.exit(1);
    }
    generateMigrationGuide(arg1, arg2);
    break;
    
  case 'template':
    createEnvTemplate(arg1);
    break;
    
  default:
    console.log('TeleShop Bot Environment Manager\n');
    console.log('Commands:');
    console.log('  check                   - Validate current environment');
    console.log('  migrate <from> <to>     - Generate migration guide');
    console.log('  template [platform]     - Create .env template');
    console.log('\nPlatforms: replit, railway, vercel, docker');
}