# Resource Optimization Guide

This guide addresses resource limitations that can cause deployment failures when moving from Replit to production platforms like Railway, Vercel, or Docker.

## Resource Limitation Problems

### 1. Memory Constraints
**Problem**: Different platforms have varying memory allocations
- **Replit**: 4GB development environment
- **Railway**: 8GB build / 512MB-32GB runtime
- **Vercel**: 3GB build / 1GB serverless runtime
- **Docker**: Configurable but often limited

**Solutions**:
- Optimize dependencies to reduce memory footprint
- Use `NODE_OPTIONS="--max-old-space-size=512"` for runtime
- Implement lazy loading for non-critical features
- Use streaming for large data processing

### 2. Build Timeouts
**Problem**: Complex builds may exceed platform timeout limits
- **Railway**: 10 minute build timeout
- **Vercel**: 45 minute build timeout (generous)
- **Replit**: Unlimited (development)

**Solutions**:
- Optimize build process with parallel steps
- Use build caching to reduce repeated work
- Remove unnecessary dependencies
- Split complex builds into stages

### 3. CPU Constraints
**Problem**: Limited CPU during build and runtime
- **Build**: Intensive TypeScript compilation, bundling
- **Runtime**: Concurrent user handling, bot processing

**Solutions**:
- Use incremental TypeScript builds
- Optimize bundling with tree shaking
- Implement efficient algorithms
- Use worker threads for CPU-intensive tasks

## Platform-Specific Optimizations

### Railway Optimizations

**Memory Management**:
```toml
# railway.toml
[build.env]
NODE_OPTIONS = "--max-old-space-size=2048"
NPM_CONFIG_PREFER_OFFLINE = "true"

[env]
NODE_OPTIONS = { default = "--max-old-space-size=512" }
```

**Build Performance**:
```toml
[build]
builder = "nixpacks"

[build.env]
NPM_CONFIG_CACHE = "/tmp/.npm"
NODE_ENV = "production"
```

### Vercel Optimizations

**Function Configuration**:
```json
{
  "functions": {
    "server/index.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=1024"
  }
}
```

**Bundle Size Limits**:
- Maximum function size: 50MB
- Use dynamic imports for code splitting
- Remove unused dependencies from bundle

### Docker Optimizations

**Multi-stage Build**:
```dockerfile
# Build stage with more memory
FROM node:18-alpine AS build
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm ci && npm run build

# Production stage with optimized memory
FROM node:18-alpine AS production
ENV NODE_OPTIONS="--max-old-space-size=512"
COPY --from=build /app/dist ./dist
```

**Resource Limits**:
```yaml
# docker-compose.yml
services:
  app:
    build: .
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## Dependency Optimization

### Heavy Dependencies to Replace

1. **Puppeteer** (~300MB)
   ```bash
   # Remove: npm uninstall puppeteer
   # Replace: npm install playwright-core
   ```

2. **Sharp** (~30MB)
   ```bash
   # Remove: npm uninstall sharp
   # Replace: npm install jimp
   ```

3. **Canvas** (~20MB)
   ```bash
   # Remove: npm uninstall canvas
   # Replace: npm install fabric
   ```

### Bundle Size Optimization

**Enable Tree Shaking**:
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      treeshake: true,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    }
  }
}
```

**Remove Development Dependencies**:
```json
{
  "scripts": {
    "build": "NODE_ENV=production npm run build:client && npm run build:server",
    "build:prod": "npm ci --only=production && npm run build"
  }
}
```

## Build Performance Optimization

### Parallel Build Steps
```json
{
  "scripts": {
    "build": "npm run build:client & npm run build:server & wait",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --platform=node --bundle --outdir=dist"
  }
}
```

### Build Caching
```dockerfile
# Optimize Docker build caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source files last to maximize cache hits
COPY . .
RUN npm run build
```

### TypeScript Optimization
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "skipLibCheck": true,
    "skipDefaultLibCheck": true
  }
}
```

## Memory Usage Monitoring

### Runtime Memory Tracking
```javascript
// Add to server startup
process.on('SIGTERM', () => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB'
  });
});
```

### Build Memory Optimization
```bash
# Set memory limits for build process
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

## Troubleshooting Resource Issues

### Build Timeout Errors
1. **Identify bottleneck**: Check which build step takes longest
2. **Optimize dependencies**: Remove or replace heavy packages
3. **Use parallel builds**: Split build into concurrent steps
4. **Enable caching**: Use platform-specific build caches

### Memory Errors
1. **Reduce bundle size**: Remove unused dependencies
2. **Optimize images**: Use appropriate formats and compression
3. **Implement lazy loading**: Load features on demand
4. **Use external services**: Move heavy processing outside main app

### CPU Performance Issues
1. **Profile performance**: Identify CPU-intensive operations
2. **Optimize algorithms**: Use efficient data structures
3. **Implement caching**: Cache expensive computations
4. **Use worker threads**: Offload heavy tasks

## Validation Commands

### Resource Analysis
```bash
# Analyze current resource usage
node scripts/resource-optimization.js

# Test optimized build
chmod +x build-optimized.sh
./build-optimized.sh
```

### Platform Testing
```bash
# Test Railway limits
NODE_OPTIONS="--max-old-space-size=512" npm start

# Test Vercel limits
NODE_OPTIONS="--max-old-space-size=1024" npm start

# Test Docker limits
docker build -f Dockerfile.optimized -t teleshop-optimized .
docker run --memory=1g teleshop-optimized
```

## Quick Optimization Checklist

- [ ] Replace heavy dependencies with lighter alternatives
- [ ] Set appropriate `NODE_OPTIONS` for memory limits
- [ ] Enable build caching and parallel processing
- [ ] Remove unused dependencies from production bundle
- [ ] Optimize asset sizes and compression
- [ ] Test build performance within platform limits
- [ ] Monitor runtime memory usage
- [ ] Implement lazy loading for non-critical features

## Emergency Resource Fixes

### Quick Memory Reduction
```bash
# Emergency dependency removal
npm uninstall puppeteer sharp canvas
npm install playwright-core jimp fabric --save

# Rebuild with memory limits
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

### Build Timeout Fix
```bash
# Split build process
npm run build:client &
npm run build:server &
wait
```

### Bundle Size Emergency
```bash
# Remove development dependencies from production
npm ci --only=production
npm run build
```

Your TeleShop Bot is now optimized for efficient resource usage across all deployment platforms!