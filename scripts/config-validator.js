#!/usr/bin/env node

/**
 * Configuration Validator for Cross-Platform Deployment
 * Validates start commands, port configuration, and platform-specific settings
 */

import fs from 'fs';
import { execSync } from 'child_process';

const PLATFORM_CONFIGS = {
  replit: {
    name: 'Replit',
    expectedPort: 'process.env.PORT || 5000',
    startCommand: 'npm run dev',
    environment: 'development',
    portBinding: '0.0.0.0',
    characteristics: {
      autoRestart: true,
      hotReload: true,
      fileWatcher: true
    }
  },
  
  railway: {
    name: 'Railway',
    expectedPort: 'process.env.PORT',
    startCommand: 'npm start',
    environment: 'production',
    portBinding: '0.0.0.0',
    characteristics: {
      healthcheck: true,
      restart: 'on-failure',
      timeout: '300s'
    }
  },
  
  vercel: {
    name: 'Vercel',
    expectedPort: 'process.env.PORT || 3000',
    startCommand: 'serverless functions',
    environment: 'production',
    portBinding: 'automatic',
    characteristics: {
      serverless: true,
      timeout: '30s',
      regions: 'multiple'
    }
  },
  
  docker: {
    name: 'Docker',
    expectedPort: 'process.env.PORT || 5000',
    startCommand: 'npm start',
    environment: 'production',
    portBinding: '0.0.0.0',
    characteristics: {
      isolated: true,
      scalable: true,
      persistent: true
    }
  }
};

function analyzeServerConfiguration() {
  const issues = [];
  const warnings = [];
  const recommendations = [];
  
  try {
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    // Check port configuration
    const portPattern = /\.listen\s*\(\s*([^,)]+)/;
    const portMatch = serverCode.match(portPattern);
    
    if (!portMatch) {
      issues.push({
        type: 'port',
        issue: 'No server.listen() found',
        severity: 'critical'
      });
    } else {
      const portConfig = portMatch[1].trim();
      
      // Check if using environment variable
      if (!portConfig.includes('process.env.PORT')) {
        issues.push({
          type: 'port',
          issue: 'Not using process.env.PORT for port configuration',
          current: portConfig,
          expected: 'process.env.PORT',
          severity: 'high'
        });
      }
      
      // Check for hardcoded port
      if (/^\d+$/.test(portConfig)) {
        issues.push({
          type: 'port',
          issue: 'Using hardcoded port number',
          current: portConfig,
          expected: 'process.env.PORT || 5000',
          severity: 'high'
        });
      }
    }
    
    // Check host binding
    const hostPattern = /\.listen\s*\([^,)]+,\s*['"`]([^'"`]+)['"`]/;
    const hostMatch = serverCode.match(hostPattern);
    
    if (hostMatch) {
      const host = hostMatch[1];
      if (host === 'localhost' || host === '127.0.0.1') {
        warnings.push({
          type: 'host',
          issue: 'Using localhost binding may cause issues in containers',
          current: host,
          recommended: '0.0.0.0',
          severity: 'medium'
        });
      }
    } else {
      // Check if host is specified at all
      if (!serverCode.includes('0.0.0.0')) {
        warnings.push({
          type: 'host',
          issue: 'Host binding not explicitly set',
          recommended: 'Use 0.0.0.0 for container compatibility',
          severity: 'low'
        });
      }
    }
    
    // Check for graceful shutdown
    if (!serverCode.includes('SIGTERM') && !serverCode.includes('SIGINT')) {
      recommendations.push({
        type: 'shutdown',
        recommendation: 'Add graceful shutdown handlers for production'
      });
    }
    
    // Check for health check endpoint
    if (!serverCode.includes('/health') && !serverCode.includes('/api/bot/status')) {
      recommendations.push({
        type: 'health',
        recommendation: 'Add health check endpoint for monitoring'
      });
    }
    
  } catch (error) {
    issues.push({
      type: 'file',
      issue: `Cannot read server/index.ts: ${error.message}`,
      severity: 'critical'
    });
  }
  
  return { issues, warnings, recommendations };
}

function analyzePackageJsonScripts() {
  const issues = [];
  const warnings = [];
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = pkg.scripts || {};
    
    // Check required scripts
    const requiredScripts = {
      'start': 'Production start command',
      'dev': 'Development start command',
      'build': 'Build command for production'
    };
    
    Object.entries(requiredScripts).forEach(([script, description]) => {
      if (!scripts[script]) {
        issues.push({
          type: 'script',
          script: script,
          issue: `Missing ${description}`,
          severity: script === 'start' ? 'critical' : 'high'
        });
      }
    });
    
    // Validate start script
    if (scripts.start) {
      const startCmd = scripts.start;
      
      // Check if start script uses development command
      if (startCmd.includes('tsx') || startCmd.includes('ts-node') || startCmd.includes('dev')) {
        warnings.push({
          type: 'script',
          script: 'start',
          issue: 'Start script appears to use development tools',
          current: startCmd,
          recommended: 'node dist/index.js',
          severity: 'medium'
        });
      }
      
      // Check if NODE_ENV is set
      if (!startCmd.includes('NODE_ENV=production')) {
        warnings.push({
          type: 'script',
          script: 'start',
          issue: 'Start script does not set NODE_ENV=production',
          current: startCmd,
          recommended: 'NODE_ENV=production node dist/index.js',
          severity: 'low'
        });
      }
    }
    
    // Check build script
    if (scripts.build) {
      const buildCmd = scripts.build;
      
      if (!buildCmd.includes('vite build') && !buildCmd.includes('tsc')) {
        warnings.push({
          type: 'script',
          script: 'build',
          issue: 'Build script may not compile TypeScript',
          current: buildCmd,
          severity: 'medium'
        });
      }
    }
    
  } catch (error) {
    issues.push({
      type: 'file',
      issue: `Cannot read package.json: ${error.message}`,
      severity: 'critical'
    });
  }
  
  return { issues, warnings };
}

function validatePlatformConfiguration(platform) {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  
  const issues = [];
  const warnings = [];
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = pkg.scripts || {};
    
    // Check start command compatibility
    if (platform === 'railway' && !scripts.start) {
      issues.push({
        type: 'railway',
        issue: 'Railway requires npm start script',
        severity: 'critical'
      });
    }
    
    if (platform === 'vercel' && !scripts['vercel-build'] && !scripts.build) {
      warnings.push({
        type: 'vercel',
        issue: 'Vercel prefers vercel-build script',
        recommendation: 'Add "vercel-build": "npm run build"',
        severity: 'medium'
      });
    }
    
    // Check environment variables
    const serverCode = fs.readFileSync('server/index.ts', 'utf8');
    
    if (platform === 'railway') {
      if (!serverCode.includes('process.env.PORT')) {
        issues.push({
          type: 'railway',
          issue: 'Railway requires process.env.PORT usage',
          severity: 'high'
        });
      }
    }
    
    if (platform === 'docker') {
      if (!serverCode.includes('0.0.0.0')) {
        warnings.push({
          type: 'docker',
          issue: 'Docker containers should bind to 0.0.0.0',
          severity: 'medium'
        });
      }
    }
    
  } catch (error) {
    issues.push({
      type: 'validation',
      issue: `Error validating ${platform}: ${error.message}`,
      severity: 'high'
    });
  }
  
  return { issues, warnings, config };
}

function generateFixedConfiguration() {
  console.log('🔧 Generating fixed configuration files...\n');
  
  const fixes = [];
  
  try {
    // Fix package.json scripts
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredScripts = {
      'start': 'NODE_ENV=production node dist/index.js',
      'build': 'vite build && tsc --project tsconfig.server.json',
      'dev': 'NODE_ENV=development tsx server/index.ts',
      'build:client': 'vite build',
      'build:server': 'tsc --project tsconfig.server.json'
    };
    
    let scriptsModified = false;
    Object.entries(requiredScripts).forEach(([script, command]) => {
      if (!pkg.scripts[script] || (script === 'start' && pkg.scripts[script] !== command)) {
        pkg.scripts[script] = command;
        scriptsModified = true;
        fixes.push(`Updated ${script} script`);
      }
    });
    
    if (scriptsModified) {
      fs.writeFileSync('package.json.fixed', JSON.stringify(pkg, null, 2));
      fixes.push('Generated package.json.fixed');
    }
    
    // Generate fixed server configuration
    const serverTemplate = `import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Port configuration for cross-platform compatibility
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

// Start server with proper binding
const server = app.listen(PORT, HOST, () => {
  console.log(\`🚀 Server running on http://\${HOST}:\${PORT}\`);
  console.log(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
`;
    
    fs.writeFileSync('server/index.fixed.ts', serverTemplate);
    fixes.push('Generated server/index.fixed.ts with proper configuration');
    
  } catch (error) {
    console.log(`❌ Error generating fixes: ${error.message}`);
  }
  
  if (fixes.length > 0) {
    console.log('✅ Generated fixes:');
    fixes.forEach(fix => console.log(`   • ${fix}`));
    console.log('\n📋 Review generated files and replace originals if changes look good');
  } else {
    console.log('ℹ️ No fixes needed');
  }
}

function generateConfigurationReport(platform = null) {
  console.log('🔍 Configuration Analysis Report\n');
  
  // Server configuration analysis
  console.log('🖥️ Server Configuration:');
  const serverAnalysis = analyzeServerConfiguration();
  
  if (serverAnalysis.issues.length > 0) {
    console.log('   ❌ Issues:');
    serverAnalysis.issues.forEach(issue => {
      console.log(`      • ${issue.issue}`);
      if (issue.current && issue.expected) {
        console.log(`        Current: ${issue.current}`);
        console.log(`        Expected: ${issue.expected}`);
      }
    });
  }
  
  if (serverAnalysis.warnings.length > 0) {
    console.log('   ⚠️ Warnings:');
    serverAnalysis.warnings.forEach(warning => {
      console.log(`      • ${warning.issue}`);
      if (warning.recommended) {
        console.log(`        Recommended: ${warning.recommended}`);
      }
    });
  }
  
  // Package.json scripts analysis
  console.log('\n📦 Package Scripts:');
  const scriptsAnalysis = analyzePackageJsonScripts();
  
  if (scriptsAnalysis.issues.length > 0) {
    console.log('   ❌ Issues:');
    scriptsAnalysis.issues.forEach(issue => {
      console.log(`      • ${issue.issue}`);
      if (issue.current && issue.recommended) {
        console.log(`        Current: ${issue.current}`);
        console.log(`        Recommended: ${issue.recommended}`);
      }
    });
  }
  
  if (scriptsAnalysis.warnings.length > 0) {
    console.log('   ⚠️ Warnings:');
    scriptsAnalysis.warnings.forEach(warning => {
      console.log(`      • ${warning.issue}`);
      if (warning.current && warning.recommended) {
        console.log(`        Current: ${warning.current}`);
        console.log(`        Recommended: ${warning.recommended}`);
      }
    });
  }
  
  // Platform-specific analysis
  if (platform && PLATFORM_CONFIGS[platform]) {
    console.log(`\n🏗️ ${PLATFORM_CONFIGS[platform].name} Compatibility:`);
    const platformAnalysis = validatePlatformConfiguration(platform);
    
    if (platformAnalysis.issues.length > 0) {
      console.log('   ❌ Issues:');
      platformAnalysis.issues.forEach(issue => {
        console.log(`      • ${issue.issue}`);
      });
    }
    
    if (platformAnalysis.warnings.length > 0) {
      console.log('   ⚠️ Warnings:');
      platformAnalysis.warnings.forEach(warning => {
        console.log(`      • ${warning.issue}`);
        if (warning.recommendation) {
          console.log(`        Recommendation: ${warning.recommendation}`);
        }
      });
    }
    
    console.log('   📋 Platform Requirements:');
    console.log(`      • Port: ${platformAnalysis.config.expectedPort}`);
    console.log(`      • Start Command: ${platformAnalysis.config.startCommand}`);
    console.log(`      • Host Binding: ${platformAnalysis.config.portBinding}`);
    console.log(`      • Environment: ${platformAnalysis.config.environment}`);
  }
  
  // Summary
  const totalIssues = serverAnalysis.issues.length + scriptsAnalysis.issues.length + 
                     (platform ? validatePlatformConfiguration(platform).issues.length : 0);
  const totalWarnings = serverAnalysis.warnings.length + scriptsAnalysis.warnings.length +
                       (platform ? validatePlatformConfiguration(platform).warnings.length : 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Critical Issues: ${totalIssues}`);
  console.log(`   Warnings: ${totalWarnings}`);
  
  if (totalIssues === 0) {
    console.log('\n✅ Configuration is ready for deployment');
  } else {
    console.log('\n🔧 Fix critical issues before deployment');
    console.log('   Run: node scripts/config-validator.js fix');
  }
  
  return { issues: totalIssues, warnings: totalWarnings };
}

// CLI interface
const command = process.argv[2];
const platform = process.argv[3];

switch (command) {
  case 'check':
    generateConfigurationReport(platform);
    break;
    
  case 'fix':
    generateFixedConfiguration();
    break;
    
  case 'platform':
    if (!platform) {
      console.log('Usage: node config-validator.js platform <platform>');
      console.log('Platforms: replit, railway, vercel, docker');
      process.exit(1);
    }
    generateConfigurationReport(platform);
    break;
    
  default:
    console.log('TeleShop Bot Configuration Validator\n');
    console.log('Commands:');
    console.log('  check [platform]       - Analyze configuration');
    console.log('  fix                    - Generate fixed configuration');
    console.log('  platform <name>        - Platform-specific analysis');
    console.log('\nPlatforms: replit, railway, vercel, docker');
}