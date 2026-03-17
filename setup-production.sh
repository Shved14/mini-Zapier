#!/bin/bash

# Production Setup Script
# This script sets up the entire mini-Zapier platform on a fresh Ubuntu VPS

set -e

echo "🚀 Setting up mini-Zapier production environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Get system information
echo -e "${BLUE}📋 System Information:${NC}"
echo -e "  OS: $(lsb_release -d | cut -f2)"
echo -e "  Kernel: $(uname -r)"
echo -e "  Architecture: $(uname -m)"
echo -e "  Memory: $(free -h | awk 'NR==2{print $2}')"
echo -e "  Disk: $(df -h / | awk 'NR==2{print $2}')"
echo -e ""

# Update system packages
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    ufw \
    fail2ban \
    logrotate \
    postgresql-client \
    redis-tools

# Create deploy user
echo -e "${YELLOW}👤 Creating deploy user...${NC}"
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    echo -e "${GREEN}✅ User 'deploy' created${NC}"
else
    echo -e "${YELLOW}⚠️  User 'deploy' already exists${NC}"
fi

# Setup SSH key for deploy user
echo -e "${YELLOW}🔑 Setting up SSH access...${NC}"
mkdir -p /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

echo -e "${BLUE}🔑 Please add your SSH public key to /home/deploy/.ssh/authorized_keys${NC}"
echo -e "${BLUE}🔑 You can do this with: sudo nano /home/deploy/.ssh/authorized_keys${NC}"

# Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
mkdir -p /opt/minizapier
mkdir -p /opt/backups/minizapier
chown -R deploy:deploy /opt/minizapier
chown -R deploy:deploy /opt/backups/minizapier

# Setup Docker
echo -e "${YELLOW}🐳 Setting up Docker...${NC}"
systemctl enable docker
systemctl start docker
usermod -aG docker deploy

# Setup UFW firewall
echo -e "${YELLOW}🔒 Setting up firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Setup fail2ban
echo -e "${YELLOW}🛡️  Setting up fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Create fail2ban configuration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl restart fail2ban

# Setup logrotate
echo -e "${YELLOW}📋 Setting up log rotation...${NC}"
cat > /etc/logrotate.d/minizapier << 'EOF'
/opt/minizapier/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        docker-compose -f /opt/minizapier/docker-compose.prod.yml restart nginx
    endscript
}
EOF

# Setup monitoring
echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
cat > /usr/local/bin/minizapier-monitor << 'EOF'
#!/bin/bash
# Mini-Zapier Monitoring Script

if [ ! -d "/opt/minizapier" ]; then
    echo "Mini-Zapier not deployed yet"
    exit 1
fi

cd /opt/minizapier

# Check services
services=("api-gateway" "auth-service" "workflow-service" "execution-service" "frontend" "nginx")

for service in "${services[@]}"; do
    if ! docker ps --filter name=$service --format '{{.Status}}' | grep -q "healthy"; then
        echo "[$(date)] $service is unhealthy" >> /var/log/minizapier-monitor.log
        # Restart unhealthy service
        docker-compose -f docker-compose.prod.yml restart $service
    fi
done

# Check disk space
disk_usage=$(df /opt/minizapier | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo "[$(date)] Disk usage is ${disk_usage}%" >> /var/log/minizapier-monitor.log
    # Clean up old logs and images
    docker system prune -f
fi

# Check memory usage
memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $memory_usage -gt 85 ]; then
    echo "[$(date)] Memory usage is ${memory_usage}%" >> /var/log/minizapier-monitor.log
fi
EOF

chmod +x /usr/local/bin/minizapier-monitor

# Setup monitoring cron job
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/minizapier-monitor") | crontab -

# Setup backup automation
echo -e "${YELLOW}📦 Setting up backup automation...${NC}"
cat > /usr/local/bin/minizapier-backup << 'EOF'
#!/bin/bash
# Mini-Zapier Backup Script

if [ ! -d "/opt/minizapier" ]; then
    echo "Mini-Zapier not deployed yet"
    exit 1
fi

cd /opt/minizapier

# Create backup directory
BACKUP_DIR="/opt/backups/minizapier/$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U postgres > $BACKUP_DIR/postgres.sql 2>/dev/null; then
    echo "PostgreSQL backup completed"
else
    echo "PostgreSQL backup failed"
fi

# Backup Redis data
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - > $BACKUP_DIR/redis.rdb 2>/dev/null; then
    echo "Redis backup completed"
else
    echo "Redis backup failed"
fi

# Backup configuration files
cp -r infrastructure $BACKUP_DIR/ 2>/dev/null
cp docker-compose.prod.yml $BACKUP_DIR/ 2>/dev/null

# Compress backup
cd /opt/backups/minizapier
tar -czf $(basename $BACKUP_DIR).tar.gz $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

# Keep only last 30 days of backups
find /opt/backups/minizapier -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $(basename $BACKUP_DIR).tar.gz"
EOF

chmod +x /usr/local/bin/minizapier-backup

# Setup backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/minizapier-backup") | crontab -

# Setup security hardening
echo -e "${YELLOW}🛡️  Setting up security hardening...${NC}"

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password authentication
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Enable key-based authentication
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH service
systemctl restart ssh

# Setup automatic security updates
echo -e "${YELLOW}🔄 Setting up automatic security updates...${NC}"
apt-get install -y unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# Create unattended-upgrades configuration
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::OnlyOnAcquirePower "true";
Unattended-Upgrade::Skip-Updates-On-Metered-Connections "true";
EOF

# Enable unattended-upgrades
systemctl enable unattended-upgrades

# Create production environment template
echo -e "${YELLOW}📝 Creating production environment template...${NC}"
cat > /opt/minizapier/.env.prod.template << 'EOF'
# Production Environment Variables
# Copy this file to .env and update with your actual values

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_DB=minizapier

# Redis Configuration
REDIS_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_32_CHARACTERS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_32_CHARACTERS
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://yourdomain.com/auth/github/callback

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=100

# Workflow Configuration
MAX_WORKFLOW_NODES=50
MAX_WORKFLOW_EDGES=100
WORKFLOW_TIMEOUT=300000

# Execution Configuration
MAX_CONCURRENT_EXECUTIONS=10
EXECUTION_TIMEOUT=300000
STEP_TIMEOUT=60000
MAX_RETRIES=3

# Security Configuration
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_32_CHARACTERS
COOKIE_SECRET=CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_32_CHARACTERS
ENCRYPTION_KEY=CHANGE_THIS_TO_RANDOM_STRING_MINIMUM_32_CHARACTERS

# Performance Configuration
NODE_ENV=production
CLUSTER_SIZE=4
CACHE_TTL=3600
API_TIMEOUT=30000

# Feature Flags
ENABLE_OAUTH=true
ENABLE_WORKFLOW_EDITOR=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
EOF

chown deploy:deploy /opt/minizapier/.env.prod.template

echo -e "${GREEN}✅ Production setup completed!${NC}"

echo -e ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Add your SSH public key to /home/deploy/.ssh/authorized_keys"
echo -e "  2. Update the production environment template:"
echo -e "     sudo nano /opt/minizapier/.env.prod.template"
echo -e "  3. Clone the repository:"
echo -e "     sudo -u deploy git clone https://github.com/your-username/mini-Zapier.git /opt/minizapier/app"
echo -e "  4. Deploy the application:"
echo -e "     sudo -u deploy /opt/minizapier/app/deploy.sh"
echo -e ""
echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo -e "  • Change all default passwords in the environment template"
echo -e "  • Use strong, unique passwords for all services"
echo -e "  • Configure your domain DNS to point to this server"
echo -e "  • Set up SSL certificates after deployment"
echo -e "  • Regularly check logs and monitoring"
echo -e ""
echo -e "${GREEN}📊 System Information:${NC}"
echo -e "  • Firewall: UFW enabled (SSH, HTTP, HTTPS)"
echo -e "  • Monitoring: Every 5 minutes"
echo -e "  • Backups: Daily at 2:00 AM"
echo -e "  • Log rotation: 30 days retention"
echo -e "  • Auto-updates: Security patches only"
echo -e ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo -e "  • Check system status: htop"
echo -e "  • View firewall status: sudo ufw status"
echo -e "  • View fail2ban status: sudo fail2ban-client status"
echo -e "  • View logs: sudo journalctl -f"
echo -e "  • Check monitoring logs: tail -f /var/log/minizapier-monitor.log"
echo -e "  • Run backup manually: sudo /usr/local/bin/minizapier-backup"
