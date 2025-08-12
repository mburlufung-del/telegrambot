#!/usr/bin/env node

/**
 * Platform Setup Assistant for TeleShop Bot
 * Automates platform-specific configuration and deployment
 */

import fs from 'fs';
import path from 'path';

const PLATFORMS = {
  railway: {
    name: 'Railway',
    configFiles: ['railway.toml'],
    envVars: {
      required: ['TELEGRAM_BOT_TOKEN'],
      production: ['WEBHOOK_URL', 'NODE_ENV'],
      optional: ['DATABASE_URL', 'WEBHOOK_SECRET']
    },
    setup: {
      webhook: true,
      database: 'postgresql-plugin',
      buildCommand: 'npm run build',
      startCommand: 'npm start'
    }
  },
  
  vercel: {
    name: 'Vercel',
    configFiles: ['vercel.json'],
    envVars: {
      required: ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_URL'],
      production: ['NODE_ENV'],
      optional: ['DATABASE_URL', 'WEBHOOK_SECRET']
    },
    setup: {
      webhook: true,
      serverless: true,
      buildCommand: 'npm run build',
      functions: true
    }
  },
  
  digitalocean: {
    name: 'DigitalOcean App Platform',
    configFiles: ['.do/app.yaml'],
    envVars: {
      required: ['TELEGRAM_BOT_TOKEN', 'WEBHOOK_URL'],
      production: ['NODE_ENV'],
      optional: ['DATABASE_URL', 'WEBHOOK_SECRET']
    },
    setup: {
      webhook: true,
      database: 'managed-database',
      buildCommand: 'npm run build',
      runCommand: 'npm start'
    }
  },
  
  docker: {
    name: 'Docker',
    configFiles: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
    envVars: {
      required: ['TELEGRAM_BOT_TOKEN'],
      production: ['NODE_ENV'],
      optional: ['DATABASE_URL', 'WEBHOOK_URL', 'WEBHOOK_SECRET']
    },
    setup: {
      webhook: 'optional',
      database: 'postgresql-container',
      healthcheck: true
    }
  }
};

function generateRailwayConfig() {
  const config = `[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/bot/status"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
NODE_ENV = { default = "production" }
PORT = { default = "5000" }

# Telegram Bot Configuration
# Add these in Railway dashboard:
# TELEGRAM_BOT_TOKEN = "your_bot_token"
# WEBHOOK_URL = "https://your-app.railway.app/webhook"
# WEBHOOK_SECRET = "your_secret" (optional)

# Database (if using Railway PostgreSQL)
# DATABASE_URL = "$\{{Postgres.DATABASE_URL}}"
`;

  fs.writeFileSync('railway.toml', config);
  return 'railway.toml';
}

function generateDigitalOceanConfig() {
  const config = {
    name: 'teleshop-bot',
    services: [
      {
        name: 'web',
        source_dir: '/',
        github: {
          repo: 'your-username/your-repo',
          branch: 'main'
        },
        run_command: 'npm start',
        build_command: 'npm run build',
        environment_slug: 'node-js',
        instance_count: 1,
        instance_size_slug: 'basic-xxs',
        health_check: {
          http_path: '/api/bot/status'
        },
        envs: [
          {
            key: 'NODE_ENV',
            value: 'production',
            scope: 'RUN_TIME'
          },
          {
            key: 'PORT',
            value: '5000',
            scope: 'RUN_TIME'
          }
        ]
      }
    ]
  };

  if (!fs.existsSync('.do')) {
    fs.mkdirSync('.do');
  }
  
  fs.writeFileSync('.do/app.yaml', `# DigitalOcean App Platform Configuration
# Add the following environment variables in the DigitalOcean dashboard:
# TELEGRAM_BOT_TOKEN (required)
# WEBHOOK_URL = https://your-app.ondigitalocean.app/webhook
# WEBHOOK_SECRET (optional)
# DATABASE_URL (if using managed database)

name: teleshop-bot

services:
- name: web
  source_dir: /
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  
  health_check:
    http_path: /api/bot/status
    
  envs:
  - key: NODE_ENV
    value: production
    scope: RUN_TIME
  - key: PORT
    value: "5000"
    scope: RUN_TIME

# Optional: Add PostgreSQL database
# databases:
# - name: teleshop-db
#   engine: PG
#   version: "15"
#   size: basic-xs
`);
  
  return '.do/app.yaml';
}

function generateDockerCompose() {
  const compose = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "\${PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
      - WEBHOOK_URL=\${WEBHOOK_URL}
      - WEBHOOK_SECRET=\${WEBHOOK_SECRET}
      - DATABASE_URL=\${DATABASE_URL:-postgresql://teleshop:password@db:5432/teleshop}
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/bot/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=teleshop
      - POSTGRES_USER=teleshop
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U teleshop -d teleshop"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;

  fs.writeFileSync('docker-compose.yml', compose);
  return 'docker-compose.yml';
}

function createPlatformEnvFile(platform) {
  const config = PLATFORMS[platform];
  if (!config) return null;

  const envContent = [
    `# ${config.name} Environment Configuration`,
    '# Add these variables in your platform dashboard\n'
  ];

  // Required variables
  envContent.push('# REQUIRED VARIABLES');
  config.envVars.required.forEach(varName => {
    envContent.push(`${varName}=your_value_here`);
  });

  // Production variables
  if (config.envVars.production) {
    envContent.push('\n# PRODUCTION VARIABLES');
    config.envVars.production.forEach(varName => {
      const defaultValue = varName === 'NODE_ENV' ? 'production' : 
                          varName === 'PORT' ? '5000' : 'your_value_here';
      envContent.push(`${varName}=${defaultValue}`);
    });
  }

  // Optional variables
  if (config.envVars.optional) {
    envContent.push('\n# OPTIONAL VARIABLES');
    config.envVars.optional.forEach(varName => {
      envContent.push(`# ${varName}=your_value_here`);
    });
  }

  // Platform-specific notes
  envContent.push(`\n# ${config.name.toUpperCase()} SPECIFIC NOTES:`);
  
  if (platform === 'railway') {
    envContent.push('# - Add variables in Railway dashboard > Variables tab');
    envContent.push('# - WEBHOOK_URL should be: https://your-app.railway.app/webhook');
    envContent.push('# - Database: Add PostgreSQL plugin for DATABASE_URL');
  }

  if (platform === 'vercel') {
    envContent.push('# - Add variables in Vercel dashboard > Settings > Environment Variables');
    envContent.push('# - WEBHOOK_URL should be: https://your-app.vercel.app/webhook');
    envContent.push('# - Serverless functions only, no polling mode');
  }

  if (platform === 'digitalocean') {
    envContent.push('# - Add variables in App Platform dashboard > Settings');
    envContent.push('# - WEBHOOK_URL should be: https://your-app.ondigitalocean.app/webhook');
    envContent.push('# - Use managed PostgreSQL for DATABASE_URL');
  }

  if (platform === 'docker') {
    envContent.push('# - Use .env file with docker-compose');
    envContent.push('# - WEBHOOK_URL optional (can use polling in containers)');
    envContent.push('# - PostgreSQL container included in docker-compose.yml');
  }

  const filename = `.env.${platform}`;
  fs.writeFileSync(filename, envContent.join('\n'));
  return filename;
}

function generateDeploymentInstructions(platform) {
  const config = PLATFORMS[platform];
  if (!config) return;

  console.log(`\n🚀 ${config.name} Deployment Instructions\n`);

  // Step 1: Prerequisites
  console.log('1️⃣ Prerequisites:');
  console.log('   • Node.js 18+ installed locally');
  console.log('   • Git repository with your code');
  console.log('   • Telegram bot token from @BotFather\n');

  // Step 2: Environment Variables
  console.log('2️⃣ Environment Variables:');
  console.log('   Required:');
  config.envVars.required.forEach(varName => {
    console.log(`   • ${varName}`);
  });
  if (config.envVars.production) {
    console.log('   Production:');
    config.envVars.production.forEach(varName => {
      console.log(`   • ${varName}`);
    });
  }

  // Step 3: Platform-specific setup
  console.log('\n3️⃣ Platform Setup:');
  
  if (platform === 'railway') {
    console.log('   • Install Railway CLI: npm install -g @railway/cli');
    console.log('   • Login: railway login');
    console.log('   • Link project: railway link');
    console.log('   • Add PostgreSQL: railway add postgresql');
    console.log('   • Set environment variables in dashboard');
    console.log('   • Deploy: railway up');
  }

  if (platform === 'vercel') {
    console.log('   • Install Vercel CLI: npm install -g vercel');
    console.log('   • Login: vercel login');
    console.log('   • Set environment variables in dashboard');
    console.log('   • Deploy: vercel --prod');
  }

  if (platform === 'digitalocean') {
    console.log('   • Connect GitHub repository in App Platform');
    console.log('   • Use provided .do/app.yaml configuration');
    console.log('   • Add environment variables in dashboard');
    console.log('   • Optional: Add managed PostgreSQL database');
  }

  if (platform === 'docker') {
    console.log('   • Copy .env.docker to .env and fill values');
    console.log('   • Build: docker-compose build');
    console.log('   • Run: docker-compose up -d');
    console.log('   • Check status: docker-compose ps');
  }

  // Step 4: Verification
  console.log('\n4️⃣ Verification:');
  console.log('   • Check deployment logs for errors');
  console.log('   • Test health endpoint: /api/bot/status');
  console.log('   • Verify bot responds in Telegram');
  console.log('   • Monitor admin dashboard functionality');

  console.log('\n✅ Deployment instructions completed!');
}

function setupPlatform(platform) {
  const config = PLATFORMS[platform];
  if (!config) {
    console.log('❌ Unknown platform. Supported platforms:');
    Object.keys(PLATFORMS).forEach(p => console.log(`   • ${p}`));
    return;
  }

  console.log(`\n🔧 Setting up ${config.name} configuration...\n`);

  const createdFiles = [];

  // Generate platform-specific config files
  if (platform === 'railway') {
    const file = generateRailwayConfig();
    createdFiles.push(file);
  }

  if (platform === 'digitalocean') {
    const file = generateDigitalOceanConfig();
    createdFiles.push(file);
  }

  if (platform === 'docker') {
    const file = generateDockerCompose();
    createdFiles.push(file);
  }

  // Create environment file
  const envFile = createPlatformEnvFile(platform);
  if (envFile) {
    createdFiles.push(envFile);
  }

  console.log('📄 Created configuration files:');
  createdFiles.forEach(file => {
    console.log(`   ✅ ${file}`);
  });

  // Generate instructions
  generateDeploymentInstructions(platform);
}

function listPlatforms() {
  console.log('\n🏗️ Supported Deployment Platforms:\n');
  
  Object.entries(PLATFORMS).forEach(([key, config]) => {
    console.log(`${key}:`);
    console.log(`   Name: ${config.name}`);
    console.log(`   Webhook: ${config.setup.webhook === true ? 'Required' : config.setup.webhook || 'Optional'}`);
    console.log(`   Database: ${config.setup.database || 'Optional'}`);
    console.log('');
  });
}

// CLI interface
const command = process.argv[2];
const platform = process.argv[3];

switch (command) {
  case 'setup':
    if (!platform) {
      console.log('Usage: node platform-setup.js setup <platform>');
      console.log('Run "node platform-setup.js list" to see available platforms');
      process.exit(1);
    }
    setupPlatform(platform);
    break;

  case 'list':
    listPlatforms();
    break;

  case 'env':
    if (!platform) {
      console.log('Usage: node platform-setup.js env <platform>');
      process.exit(1);
    }
    const envFile = createPlatformEnvFile(platform);
    if (envFile) {
      console.log(`✅ Created environment template: ${envFile}`);
    } else {
      console.log('❌ Unknown platform');
    }
    break;

  default:
    console.log('TeleShop Bot Platform Setup Assistant\n');
    console.log('Commands:');
    console.log('  setup <platform>   - Generate platform configuration');
    console.log('  env <platform>     - Create environment template');
    console.log('  list               - Show supported platforms');
    console.log('\nPlatforms: railway, vercel, digitalocean, docker');
}