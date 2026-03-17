# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create health check script
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Create logs directory
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx /usr/share/nginx/html

EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh || exit 1

CMD ["nginx", "-g", "daemon off;"]
