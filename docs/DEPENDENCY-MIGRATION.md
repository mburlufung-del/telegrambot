# Dependency Migration Guide

This guide addresses dependency compatibility issues when moving your TeleShop Bot between platforms.

## Common Dependency Issues

### 1. Platform-Specific Dependencies

**Problem**: Some packages have different behaviors or requirements across platforms.

**Examples**:
- `sharp` requires native compilation on some platforms
- `bcrypt` needs build tools not available in serverless environments
- `sqlite3` doesn't work in serverless/stateless deployments

**Solutions**:
- Use platform-compatible alternatives
- Pre-compiled binaries when available
- External services for complex operations

### 2. Missing Build Tools

**Problem**: Platforms like Vercel or Replit may not have all build tools installed.

**Solution**: Use pure JavaScript alternatives or pre-compiled packages.

### 3. Version Inconsistencies

**Problem**: Different Node.js versions across platforms cause compatibility issues.

**Solution**: Lock Node.js version using engines field in package.json.

## Platform-Specific Solutions

### Railway
- **Node.js**: 16.x, 18.x, 20.x supported
- **Build Tools**: Full access to build tools
- **Native Modules**: Supported
- **Memory**: 8GB limit during builds
- **Storage**: Persistent disk available

**Recommendations**:
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Vercel
- **Node.js**: 18.x, 20.x supported
- **Environment**: Serverless functions
- **Function Size**: 50MB limit
- **Build Tools**: Available during build
- **Runtime**: Read-only filesystem

**Problem Dependencies**:
- `sharp` → Use `@vercel/edge` or `jimp`
- `sqlite3` → Use external database
- `puppeteer` → Use `playwright-core` or external service

**Optimized package.json**:
```json
{
  "dependencies": {
    "jimp": "^0.22.0",
    "@neondatabase/serverless": "^0.10.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Docker
- **Node.js**: Configurable (recommend 18-alpine)
- **Build Tools**: Full control
- **Image Size**: Consider optimization
- **Native Modules**: Supported with proper base image

**Multi-stage optimization**:
```dockerfile
# Build stage
FROM node:18-alpine AS build
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --include=dev

# Production stage  
FROM node:18-alpine AS production
COPY --from=build /app/node_modules ./node_modules
```

### Replit
- **Node.js**: 18.x (managed)
- **Build Tools**: Limited
- **Storage**: Development only
- **Dependencies**: Prefer lightweight packages

**Problem Dependencies**:
- `puppeteer` → Too large, use alternatives
- `sharp` → May fail compilation
- Native modules → Use pure JS alternatives

## Dependency Alternatives

### Image Processing
```bash
# Instead of sharp (native)
npm install jimp

# Instead of canvas (native)
npm install fabric
```

### Database
```bash
# Instead of sqlite3 (file-based)
npm install @neondatabase/serverless

# Instead of pg (connection-heavy)
npm install @neondatabase/serverless
```

### Encryption
```bash
# Instead of bcrypt (native)
npm install bcryptjs

# Instead of argon2 (native)
npm install @noble/hashes
```

### Validation & Security
```bash
# Keep lightweight alternatives
npm install zod # Type-safe validation
npm install nanoid # ID generation
```

## Migration Steps

### 1. Audit Current Dependencies
```bash
node scripts/dependency-audit.js audit
```

### 2. Platform-Specific Analysis
```bash
node scripts/package-compatibility.js check railway
node scripts/package-compatibility.js check vercel
```

### 3. Generate Optimized Configurations
```bash
node scripts/package-compatibility.js optimize railway
node scripts/package-compatibility.js optimize vercel
```

### 4. Test Platform Compatibility
```bash
# Railway
npm ci
npm run build
npm start

# Vercel
vercel build
vercel dev

# Docker
docker build -t teleshop-test .
docker run -p 5000:5000 teleshop-test
```

## Security Considerations

### 1. Keep Dependencies Updated
```bash
npm audit
npm audit fix
npm update
```

### 2. Lock Versions for Production
- Use exact versions in package-lock.json
- Pin critical dependencies in package.json
- Regular security audits

### 3. Minimize Attack Surface
- Remove unused dependencies
- Use `npm ci` for production installs
- Keep devDependencies separate

## Troubleshooting

### Build Failures
1. Check Node.js version compatibility
2. Verify all dependencies are platform-compatible
3. Review build logs for missing tools
4. Use platform-specific alternatives

### Runtime Errors
1. Ensure all runtime dependencies are included
2. Check for missing environment variables
3. Verify database connections work
4. Test API endpoints

### Performance Issues
1. Analyze bundle size
2. Remove unused dependencies
3. Use code splitting where possible
4. Optimize Docker images with multi-stage builds

## Platform Migration Checklist

- [ ] Audit current dependencies
- [ ] Check platform compatibility
- [ ] Replace problematic packages
- [ ] Update engines in package.json
- [ ] Test build process
- [ ] Verify runtime functionality
- [ ] Update deployment configuration
- [ ] Document changes

## Quick Commands

```bash
# Complete dependency analysis
node scripts/dependency-audit.js audit

# Platform-specific check
node scripts/package-compatibility.js check railway

# Generate optimized package.json
node scripts/package-compatibility.js optimize vercel

# Security audit
npm audit
npm audit fix

# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```