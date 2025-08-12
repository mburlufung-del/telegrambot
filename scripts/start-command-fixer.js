#!/usr/bin/env node

/**
 * Start Command Configuration Fixer
 * Ensures proper start commands and port configuration for all platforms
 */

import fs from 'fs';

const PLATFORM_START_COMMANDS = {
  development: {
    command: 'NODE_ENV=development tsx server/index.ts',
    description: 'Development with hot reload'
  },
  production: {
    command: 'NODE_ENV=production node dist/index.js',
    description: 'Production with compiled JavaScript'
  },
  railway: {
    command: 'npm start',
    internalCommand: 'NODE_ENV=production node dist/index.js',
    description: 'Railway expects npm start'
  },
  vercel: {
    command: 'vercel-build',
    internalCommand: 'npm run build',
    description: 'Vercel serverless deployment'
  },
  docker: {
    command: 'npm start',
    internalCommand: 'NODE_ENV=production node dist/index.js',
    description: 'Docker container startup'
  }
};

function checkCurrentConfiguration() {
  console.log('🔍 Checking Current Configuration...\n');
  
  const issues = [];
  const status = {
    serverPort: false,
    serverHost: false,
    startScript: false,
    buildScript: false
  };
  
  // Check server configuration
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    // Check port configuration
    if (serverCode.includes('process.env.PORT')) {
      status.serverPort = true;
      console.log('✅ Server uses process.env.PORT');
    } else {
      issues.push('Server does not use process.env.PORT');
      console.log('❌ Server does not use process.env.PORT');
    }
    
    // Check host binding
    if (serverCode.includes('0.0.0.0')) {
      status.serverHost = true;
      console.log('✅ Server binds to 0.0.0.0 (container-friendly)');
    } else {
      issues.push('Server should bind to 0.0.0.0 for container compatibility');
      console.log('⚠️ Server binding not optimal for containers');
    }
    
  } catch (error) {
    issues.push(`Cannot read server file: ${error.message}`);
  }
  
  // Check package.json scripts
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = pkg.scripts || {};
    
    // Check start script
    if (scripts.start) {
      status.startScript = true;
      console.log(`✅ Start script exists: ${scripts.start}`);
      
      if (scripts.start.includes('NODE_ENV=production')) {
        console.log('✅ Start script sets production environment');
      } else {
        issues.push('Start script should set NODE_ENV=production');
        console.log('⚠️ Start script should set NODE_ENV=production');
      }
    } else {
      issues.push('Missing start script');
      console.log('❌ Missing start script');
    }
    
    // Check build script
    if (scripts.build) {
      status.buildScript = true;
      console.log(`✅ Build script exists: ${scripts.build}`);
    } else {
      issues.push('Missing build script');
      console.log('❌ Missing build script');
    }
    
  } catch (error) {
    issues.push(`Cannot read package.json: ${error.message}`);
  }
  
  return { issues, status };
}

function fixPackageJsonScripts() {
  console.log('\n🔧 Fixing package.json scripts...\n');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Define the correct scripts
    const correctScripts = {
      'dev': 'NODE_ENV=development tsx server/index.ts',
      'build': 'vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
      'start': 'NODE_ENV=production node dist/index.js',
      'build:client': 'vite build',
      'build:server': 'esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
      'preview': 'npm run build && npm start',
      'check': 'tsc'
    };
    
    let modified = false;
    
    // Update scripts that are missing or incorrect
    Object.entries(correctScripts).forEach(([script, command]) => {
      if (!pkg.scripts[script] || pkg.scripts[script] !== command) {
        console.log(`✅ ${script === 'start' && pkg.scripts[script] ? 'Updated' : 'Added'} ${script} script`);
        pkg.scripts[script] = command;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      console.log('\n✅ package.json updated successfully');
    } else {
      console.log('ℹ️ package.json scripts are already correct');
    }
    
    return modified;
    
  } catch (error) {
    console.log(`❌ Error fixing package.json: ${error.message}`);
    return false;
  }
}

function generatePlatformConfigs() {
  console.log('\n📦 Generating platform-specific configurations...\n');
  
  const configs = {};
  
  // Generate Railway configuration
  configs.railway = {
    'railway.toml': `[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/bot/status"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
NODE_ENV = { default = "production" }
PORT = { default = "5000" }
`,
    
    'package.json.railway': (pkg) => ({
      ...pkg,
      scripts: {
        ...pkg.scripts,
        'railway:build': 'npm run build',
        'railway:start': 'NODE_ENV=production node dist/index.js'
      }
    })
  };
  
  // Generate Vercel configuration
  configs.vercel = {
    'vercel.json': JSON.stringify({
      version: 2,
      builds: [
        {
          src: 'server/index.ts',
          use: '@vercel/node'
        }
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/server/index.ts'
        },
        {
          src: '/(.*)',
          dest: '/client/dist/$1'
        }
      ],
      env: {
        NODE_ENV: 'production'
      }
    }, null, 2),
    
    'package.json.vercel': (pkg) => ({
      ...pkg,
      scripts: {
        ...pkg.scripts,
        'vercel-build': 'npm run build',
        'vercel:dev': 'vercel dev'
      }
    })
  };
  
  // Generate Docker configurations
  configs.docker = {
    'Dockerfile.optimized': `# Multi-stage build for production
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S teleshop -u 1001
RUN chown -R teleshop:nodejs /app
USER teleshop

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/api/bot/status || exit 1

CMD ["npm", "start"]
`,
    
    'docker-compose.yml': `version: '3.8'
services:
  app:
    build: .
    ports:
      - "\${PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - TELEGRAM_BOT_TOKEN=\${TELEGRAM_BOT_TOKEN}
      - WEBHOOK_URL=\${WEBHOOK_URL}
      - DATABASE_URL=\${DATABASE_URL}
    restart: unless-stopped
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/bot/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=teleshop
      - POSTGRES_USER=teleshop
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`
  };
  
  // Write configuration files
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  Object.entries(configs).forEach(([platform, files]) => {
    console.log(`📄 Generating ${platform} configuration...`);
    
    Object.entries(files).forEach(([filename, content]) => {
      if (filename.includes('package.json')) {
        const platformPkg = typeof content === 'function' ? content(pkg) : content;
        fs.writeFileSync(filename, JSON.stringify(platformPkg, null, 2));
      } else {
        fs.writeFileSync(filename, content);
      }
      console.log(`   ✅ Created ${filename}`);
    });
  });
}

function testServerConfiguration() {
  console.log('\n🧪 Testing server configuration...\n');
  
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    // Test port parsing
    const portMatch = serverCode.match(/parseInt\(process\.env\.PORT.*?\)/);
    if (portMatch) {
      console.log('✅ Port parsing looks correct');
      console.log(`   Found: ${portMatch[0]}`);
    } else {
      console.log('⚠️ Port parsing might need review');
    }
    
    // Test host binding
    const hostMatch = serverCode.match(/host:\s*["']([^"']+)["']/);
    if (hostMatch) {
      const host = hostMatch[1];
      if (host === '0.0.0.0') {
        console.log('✅ Host binding is container-friendly');
      } else {
        console.log(`⚠️ Host binding (${host}) may cause issues in containers`);
      }
    }
    
    // Check for graceful shutdown
    if (serverCode.includes('SIGTERM') || serverCode.includes('SIGINT')) {
      console.log('✅ Graceful shutdown handlers present');
    } else {
      console.log('⚠️ Consider adding graceful shutdown handlers');
    }
    
  } catch (error) {
    console.log(`❌ Error testing configuration: ${error.message}`);
  }
}

function generateStartupScript() {
  console.log('\n📄 Generating startup verification script...\n');
  
  const script = `#!/bin/bash
# TeleShop Bot Startup Verification Script

echo "🚀 TeleShop Bot Startup Verification"
echo "===================================="

# Check Node.js version
echo "📋 Node.js version: $(node --version)"

# Check if build exists
if [ -d "dist" ]; then
    echo "✅ Build directory exists"
else
    echo "❌ Build directory missing - run 'npm run build' first"
    exit 1
fi

# Check environment variables
echo "📊 Environment check:"
echo "   NODE_ENV: \${NODE_ENV:-not set}"
echo "   PORT: \${PORT:-5000}"

# Check required environment variables for production
if [ "\$NODE_ENV" = "production" ]; then
    if [ -z "\$TELEGRAM_BOT_TOKEN" ]; then
        echo "⚠️ TELEGRAM_BOT_TOKEN not set"
    else
        echo "✅ TELEGRAM_BOT_TOKEN configured"
    fi
fi

# Test port availability
PORT=\${PORT:-5000}
if lsof -i :\$PORT >/dev/null 2>&1; then
    echo "⚠️ Port \$PORT is already in use"
else
    echo "✅ Port \$PORT is available"
fi

echo ""
echo "🎯 Starting application..."
echo "   Command: npm start"
echo "   Port: \$PORT"
echo "   Environment: \${NODE_ENV:-development}"
echo ""

# Start the application
exec npm start
`;
  
  fs.writeFileSync('start.sh', script);
  
  try {
    fs.chmodSync('start.sh', '755');
    console.log('✅ Created executable start.sh script');
  } catch (error) {
    console.log('✅ Created start.sh script (make executable with: chmod +x start.sh)');
  }
}

// Main execution
function main() {
  console.log('🔧 TeleShop Bot Start Command Configuration Fixer\n');
  
  // Check current state
  const { issues, status } = checkCurrentConfiguration();
  
  if (issues.length === 0) {
    console.log('\n🎉 Configuration is already correct!');
    return;
  }
  
  console.log(`\n📋 Found ${issues.length} configuration issues`);
  
  // Fix package.json
  const scriptsFixed = fixPackageJsonScripts();
  
  // Generate platform configs
  generatePlatformConfigs();
  
  // Test configuration
  testServerConfiguration();
  
  // Generate startup script
  generateStartupScript();
  
  console.log('\n✅ Configuration fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test build: npm run build');
  console.log('2. Test start: npm start');
  console.log('3. Deploy to platform of choice');
  console.log('4. Use ./start.sh for deployment verification');
}

main();