FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Force cache invalidation and build in same RUN command
# The date command ensures this layer is never cached
RUN echo "Build timestamp: $(date)" && rm -rf dist node_modules/.vite && pnpm run build && echo "Build completed at: $(date)"

# Production stage
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches/

# Install ALL dependencies (vite is needed at runtime for this project)
RUN pnpm install --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["node", "dist/index.js"]
