# =========================================================================
# Stage 1: Build stage with Node.js
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install dependencies first for Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# 2. Copy source files and configuration
COPY . .

# 3. Build Angular production bundle
RUN npm run build -- --configuration=production

# =========================================================================
# Stage 2: Production runtime stage with Nginx Alpine
# =========================================================================
FROM nginx:1.27-alpine AS runner

# Remove default Nginx HTML content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Angular distribution bundle to Nginx document root
COPY --from=builder /app/dist/duavero-frontend/browser /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
