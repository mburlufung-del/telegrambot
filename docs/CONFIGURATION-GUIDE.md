# Configuration Guide for Cross-Platform Deployment

This guide ensures your TeleShop Bot is properly configured for deployment across all supported platforms.

## Configuration Problems Solved

### 1. Start Command Issues
**Problem**: Different platforms expect different start commands
- Replit: Uses `npm run dev` for development
- Railway: Expects `npm start` for production
- Vercel: Uses serverless functions
- Docker: Needs `npm start` in containers

**Solution**: Platform-specific package.json scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "start": "NODE_ENV=production node dist/index.js", 
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### 2. Port Configuration Issues
**Problem**: Platforms assign dynamic ports via `process.env.PORT`
- Railway: Dynamic port assignment
- Vercel: Automatic port handling
- Docker: Configurable port mapping

**Solution**: Environment-aware port binding
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
server.listen({
  port,
  host: "0.0.0.0",  // Essential for container compatibility
  reusePort: true,
});
```

### 3. Host Binding Problems
**Problem**: `localhost` binding doesn't work in containers
- Development: `localhost` works locally
- Production: Containers need `0.0.0.0` binding

**Solution**: Always use `0.0.0.0` for production compatibility

## Platform-Specific Configurations

### Railway
```bash
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/bot/status"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
NODE_ENV = { default = "production" }
PORT = { default = "5000" }
```

**Environment Variables Required**:
- `TELEGRAM_BOT_TOKEN` (critical)
- `NODE_ENV=production` (automatic)
- `WEBHOOK_URL` (format: https://your-app.railway.app/webhook)

### Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    }
  ]
}
```

**Key Requirements**:
- Serverless functions only
- Webhook mode required (no polling)
- 50MB function size limit

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

**Configuration Features**:
- Multi-stage builds for optimization
- Health checks included
- Non-root user for security
- Configurable via environment variables

## Environment Variable Management

### Development (.env)
```bash
NODE_ENV=development
PORT=5000
TELEGRAM_BOT_TOKEN=your_token_here
```

### Production (Platform-specific)
```bash
NODE_ENV=production
PORT=${PORT}  # Platform-assigned
TELEGRAM_BOT_TOKEN=your_token_here
WEBHOOK_URL=https://your-domain.com/webhook
WEBHOOK_SECRET=your_secret_here
DATABASE_URL=postgresql://... # Optional
```

## Common Configuration Mistakes

### ❌ Wrong Start Command
```json
{
  "scripts": {
    "start": "tsx server/index.ts"  // Uses dev tools
  }
}
```

### ✅ Correct Start Command
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### ❌ Wrong Port Configuration
```typescript
const port = 5000;  // Hardcoded port
server.listen(port, 'localhost');  // Wrong host
```

### ✅ Correct Port Configuration
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
server.listen({ port, host: "0.0.0.0" });
```

## Validation Commands

### Check Configuration
```bash
node scripts/config-validator.js check
node scripts/config-validator.js platform railway
```

### Test Build Process
```bash
npm run build
npm start  # Test production build
```

### Validate Platform Compatibility
```bash
node scripts/package-compatibility.js check railway
node scripts/deployment-configuration-test.js
```

## Troubleshooting

### Build Failures
1. **Missing start script**: Add to package.json
2. **TypeScript errors**: Run `tsc --noEmit` to check
3. **Dependency issues**: Run `npm audit fix`

### Runtime Issues
1. **Port binding errors**: Check `process.env.PORT` usage
2. **Host connectivity**: Ensure `0.0.0.0` binding
3. **Environment variables**: Verify all required vars are set

### Platform-Specific Issues

**Railway**:
- Build timeout: Optimize dependencies
- Memory limit: Use lighter alternatives
- Health check fails: Ensure `/api/bot/status` endpoint

**Vercel**:
- Function size limit: Remove large dependencies
- Serverless timeout: Optimize cold starts
- File system access: Use external storage

**Docker**:
- Image size: Use multi-stage builds
- Network access: Check port mapping
- Permissions: Use non-root user

## Migration Checklist

- [ ] Port configuration uses `process.env.PORT`
- [ ] Host binding set to `0.0.0.0`
- [ ] Start script uses compiled JavaScript
- [ ] Build script includes both client and server
- [ ] Environment variables properly configured
- [ ] Health check endpoint available
- [ ] Platform-specific config files created
- [ ] Build process tested and working

## Quick Commands

```bash
# Validate configuration
node scripts/config-validator.js check

# Fix common issues
node scripts/start-command-fixer.js

# Test deployment readiness
node scripts/deployment-configuration-test.js

# Generate platform configs
node scripts/platform-setup.js setup railway
node scripts/platform-setup.js setup vercel
node scripts/platform-setup.js setup docker
```

Your TeleShop Bot is now configured for seamless deployment across all platforms!