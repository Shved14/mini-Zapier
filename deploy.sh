#!/bin/bash

# Production Deployment Script
# This script deploys the mini-Zapier platform to a VPS

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER=${DEPLOY_USER:-"deploy"}
DEPLOY_HOST=${DEPLOY_HOST:-"your-domain.com"}
DEPLOY_PATH="/opt/minizapier"
BACKUP_PATH="/opt/backups/minizapier"

# Check if required variables are set
if [ -z "$DEPLOY_HOST" ]; then
    echo -e "${RED}❌ DEPLOY_HOST environment variable is required${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Host: ${DEPLOY_HOST}"
echo -e "  User: ${DEPLOY_USER}"
echo -e "  Path: ${DEPLOY_PATH}"
echo -e ""

# Function to execute command on remote server
remote_exec() {
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $DEPLOY_USER@$DEPLOY_HOST "$1"
}

# Function to copy files to remote server
remote_copy() {
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r $1 $DEPLOY_USER@$DEPLOY_HOST:$2
}

echo -e "${BLUE}🔧 Preparing deployment...${NC}"

# Create backup directory
echo -e "${YELLOW}📦 Creating backup...${NC}"
remote_exec "sudo mkdir -p $BACKUP_PATH && sudo chmod 755 $BACKUP_PATH"

# Backup current deployment if exists
if remote_exec "[ -d '$DEPLOY_PATH/.git' ]"; then
    echo -e "${YELLOW}📦 Backing up current deployment...${NC}"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    remote_exec "sudo cp -r $DEPLOY_PATH $BACKUP_PATH/$BACKUP_NAME"
    echo -e "${GREEN}✅ Backup created: $BACKUP_NAME${NC}"
fi

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
remote_exec "sudo mkdir -p $DEPLOY_PATH && sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH"

echo -e "${BLUE}📦 Deploying application files...${NC}"

# Copy application files
echo -e "${YELLOW}📋 Copying application files...${NC}"
remote_copy . $DEPLOY_PATH/

echo -e "${BLUE}🐳 Building and starting Docker containers...${NC}"

# Stop existing services
echo -e "${YELLOW}⏹️  Stopping existing services...${NC}"
remote_exec "cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml down || true"

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
remote_exec "cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml pull"

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
remote_exec "cd $DEPLOY_PATH && chmod +x infrastructure/migrations/run-migrations.sh && ./infrastructure/migrations/run-migrations.sh"

# Seed initial data (only on first deploy)
echo -e "${YELLOW}🌱 Seeding initial data...${NC}"
remote_exec "cd $DEPLOY_PATH && chmod +x infrastructure/seeds/seed-data.sh && [ ! -f .deployed ] && ./infrastructure/seeds/seed-data.sh && touch .deployed || echo 'Data already seeded'"

# Start services
echo -e "${YELLOW}▶️  Starting services...${NC}"
remote_exec "cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml up -d"

echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"

# Wait for services to start
sleep 30

# Check service health
echo -e "${YELLOW}🔍 Checking service health...${NC}"
services=("api-gateway" "auth-service" "workflow-service" "execution-service" "frontend" "nginx")

for service in "${services[@]}"; do
    echo -e "${BLUE}📊 Checking $service...${NC}"
    health=$(remote_exec "docker ps --filter name=$service --format '{{.Status}}'")
    if [[ $health == *"healthy"* ]]; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
    else
        echo -e "${RED}❌ $service is not healthy${NC}"
        echo -e "${YELLOW}📋 Service status: $health${NC}"
    fi
done

echo -e "${BLUE}🔧 Setting up SSL certificates...${NC}"

# Setup SSL with Let's Encrypt (if domain is configured)
if [ "$DEPLOY_HOST" != "localhost" ] && [ "$DEPLOY_HOST" != "your-domain.com" ]; then
    echo -e "${YELLOW}🔐 Setting up SSL certificates...${NC}"
    
    # Install certbot if not present
    remote_exec "which certbot || sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx"
    
    # Generate SSL certificate
    remote_exec "sudo certbot --nginx -d $DEPLOY_HOST --non-interactive --agree-tos --email admin@$DEPLOY_HOST || echo 'SSL certificate already exists or failed'"
    
    # Setup auto-renewal
    remote_exec "sudo crontab -l | grep -q 'certbot renew' || (echo '0 12 * * * /usr/bin/certbot renew --quiet' | sudo crontab -)"
else
    echo -e "${YELLOW}⚠️  Skipping SSL setup for localhost or demo domain${NC}"
fi

echo -e "${BLUE}🔧 Setting up monitoring...${NC}"

# Setup log rotation
echo -e "${YELLOW}📋 Setting up log rotation...${NC}"
remote_exec "sudo tee /etc/logrotate.d/minizapier > /dev/null << 'EOF'
$DEPLOY_PATH/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        docker-compose -f $DEPLOY_PATH/docker-compose.prod.yml restart nginx
    endscript
}
EOF"

# Setup monitoring script
echo -e "${YELLOW}📊 Setting up monitoring script...${NC}"
remote_exec "sudo tee /usr/local/bin/minizapier-monitor > /dev/null << 'EOF'
#!/bin/bash
# Mini-Zapier Monitoring Script

cd $DEPLOY_PATH

# Check services
services=(\"api-gateway\" \"auth-service\" \"workflow-service\" \"execution-service\" \"frontend\" \"nginx\")

for service in \"\${services[@]}\"; do
    if ! docker ps --filter name=\$service --format '{{.Status}}' | grep -q \"healthy\"; then
        echo \"[\$(date)] \$service is unhealthy\" >> /var/log/minizapier-monitor.log
        # Restart unhealthy service
        docker-compose -f docker-compose.prod.yml restart \$service
    fi
done

# Check disk space
disk_usage=\$(df $DEPLOY_PATH | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$disk_usage -gt 80 ]; then
    echo \"[\$(date)] Disk usage is \${disk_usage}%\" >> /var/log/minizapier-monitor.log
    # Clean up old logs and images
    docker system prune -f
fi

# Check memory usage
memory_usage=\$(free | awk 'NR==2{printf \"%.0f\", \$3*100/\$2}')
if [ \$memory_usage -gt 85 ]; then
    echo \"[\$(date)] Memory usage is \${memory_usage}%\" >> /var/log/minizapier-monitor.log
fi
EOF"

remote_exec "sudo chmod +x /usr/local/bin/minizapier-monitor"

# Setup monitoring cron job
remote_exec "sudo crontab -l | grep -q 'minizapier-monitor' || (echo '*/5 * * * * /usr/local/bin/minizapier-monitor' | sudo crontab -)"

echo -e "${BLUE}🔧 Setting up backup automation...${NC}"

# Setup backup script
echo -e "${YELLOW}📦 Setting up backup automation...${NC}"
remote_exec "sudo tee /usr/local/bin/minizapier-backup > /dev/null << 'EOF'
#!/bin/bash
# Mini-Zapier Backup Script

cd $DEPLOY_PATH

# Create backup directory
BACKUP_DIR=\"$BACKUP_PATH/\$(date +%Y%m%d-%H%M%S)\"
mkdir -p \$BACKUP_DIR

# Backup databases
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U postgres > \$BACKUP_DIR/postgres.sql

# Backup Redis data
docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - > \$BACKUP_DIR/redis.rdb

# Backup configuration files
cp -r infrastructure \$BACKUP_DIR/
cp docker-compose.prod.yml \$BACKUP_DIR/

# Compress backup
cd $BACKUP_PATH
tar -czf \$(basename \$BACKUP_DIR).tar.gz \$(basename \$BACKUP_DIR)
rm -rf \$BACKUP_DIR

# Keep only last 30 days of backups
find $BACKUP_PATH -name \"*.tar.gz\" -mtime +30 -delete

echo \"Backup completed: \$(basename \$BACKUP_DIR).tar.gz\"
EOF"

remote_exec "sudo chmod +x /usr/local/bin/minizapier-backup"

# Setup backup cron job
remote_exec "sudo crontab -l | grep -q 'minizapier-backup' || (echo '0 2 * * * /usr/local/bin/minizapier-backup' | sudo crontab -)"

echo -e "${BLUE}🔧 Setting up firewall...${NC}"

# Setup UFW firewall
echo -e "${YELLOW}🔒 Setting up firewall...${NC}"
remote_exec "
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
"

echo -e "${BLUE}🎉 Deployment completed successfully!${NC}"

# Display deployment information
echo -e "${GREEN}📋 Deployment Information:${NC}"
echo -e "  🌐 Application URL: https://$DEPLOY_HOST"
echo -e "  📊 API Gateway: https://$DEPLOY_HOST/api"
echo -e "  🔍 Health Check: https://$DEPLOY_HOST/health"
echo -e "  📦 Backup Location: $BACKUP_PATH"
echo -e "  📋 Logs Location: $DEPLOY_PATH/logs"
echo -e ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo -e "  View logs: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml logs -f'"
echo -e "  Restart services: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml restart'"
echo -e "  Check status: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml ps'"
echo -e "  Run backup: ssh $DEPLOY_USER@$DEPLOY_HOST '/usr/local/bin/minizapier-backup'"
echo -e ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "  • Make sure DNS is configured to point to $DEPLOY_HOST"
echo -e "  • SSL certificates will be auto-renewed by Let's Encrypt"
echo -e "  • Backups run daily at 2:00 AM"
echo -e "  • Monitoring runs every 5 minutes"
echo -e "  • Log rotation keeps 30 days of logs"

# Final health check
echo -e "${BLUE}🔍 Final health check...${NC}"
sleep 10

if curl -f -s https://$DEPLOY_HOST/health > /dev/null; then
    echo -e "${GREEN}✅ Application is healthy and accessible!${NC}"
else
    echo -e "${RED}❌ Application health check failed${NC}"
    echo -e "${YELLOW}📋 Please check the logs: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker-compose -f docker-compose.prod.yml logs'${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Your mini-Zapier platform is now live at: https://$DEPLOY_HOST${NC}"
