#!/bin/bash
# Build Optimization Script

echo "🔧 Optimizing build for deployment..."

# Clean previous builds
rm -rf dist node_modules/.cache

# Set build environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export NPM_CONFIG_PREFER_OFFLINE=true

# Clean install dependencies
npm ci --prefer-offline

# Run optimized build
echo "📦 Building with optimizations..."
npm run build

# Verify build output
if [ -f "dist/index.js" ] && [ -f "dist/public/index.html" ]; then
    echo "✅ Build completed successfully"
    
    # Display build statistics
    echo "📊 Build Statistics:"
    echo "   Server bundle: $(du -h dist/index.js | cut -f1)"
    echo "   Client bundle: $(du -sh dist/public | cut -f1)"
    echo "   Total size: $(du -sh dist | cut -f1)"
else
    echo "❌ Build failed or incomplete"
    exit 1
fi
