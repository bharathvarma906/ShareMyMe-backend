# Production Dockerfile for Render Deployment
# Base image: Node.js 20 Alpine for minimal size and high performance
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package definitions first for optimal Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --silent || npm install --omit=dev

# Copy application source code
COPY . .

# Set proper file permissions for security
RUN chown -R node:node /app

# Use non-root user
USER node

# Expose default port (Render sets $PORT dynamically, but EXPOSE documents default)
EXPOSE 5000

# Start backend server
CMD ["node", "src/server.js"]
