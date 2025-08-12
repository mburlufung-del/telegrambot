FROM node:18-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S teleshop -u 1001

# Change ownership of the app directory
RUN chown -R teleshop:nodejs /app
USER teleshop

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/bot/status || exit 1

# Start the application
CMD ["npm", "start"]