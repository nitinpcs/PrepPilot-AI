FROM node:20-alpine AS base
WORKDIR /app

# Install only production dependencies first for caching
COPY package.json .
COPY package-lock.json .
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Expose the API port (default 5000)
EXPOSE 5000

# Use production start script (or dev if you prefer)
CMD ["node", "server.js"]
