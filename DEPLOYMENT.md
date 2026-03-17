# 🚀 Production Deployment Guide

This guide covers the complete production deployment of the mini-Zapier automation platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Deployment](#manual-deployment)
- [CI/CD Deployment](#cicd-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB SSD, Recommended 100GB+
- **CPU**: Minimum 2 cores, Recommended 4 cores+
- **Network**: Stable internet connection
- **Domain**: Custom domain (recommended for SSL)

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- SSH access with sudo privileges

## ⚡ Quick Start

### 1. One-Command Setup

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/your-username/mini-Zapier/main/setup-production.sh | sudo bash

# After setup, deploy the application
sudo -u deploy git clone https://github.com/your-username/mini-Zapier.git /opt/minizapier/app
sudo -u deploy /opt/minizapier/app/deploy.sh
```

### 2. Access Your Platform

- **Application**: `https://your-domain.com`
- **API**: `https://your-domain.com/api`
- **Health Check**: `https://your-domain.com/health`

## 🔧 Manual Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo,docker deploy
```

### 2. Clone Repository

```bash
# Switch to deploy user
sudo su - deploy

# Clone repository
git clone https://github.com/your-username/mini-Zapier.git /opt/minizapier
cd /opt/minizapier
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.prod.template .env

# Edit configuration
nano .env
```

**Required variables to update:**
- `POSTGRES_PASSWORD` - Strong password
- `REDIS_PASSWORD` - Strong password
- `JWT_SECRET` - Random 32+ character string
- `JWT_REFRESH_SECRET` - Random 32+ character string
- `FRONTEND_URL` - Your domain
- `CORS_ORIGIN` - Your domain
- OAuth credentials (Google, GitHub)
- SMTP settings

### 4. Deploy Application

```bash
# Make scripts executable
chmod +x deploy.sh
chmod +x infrastructure/migrations/run-migrations.sh
chmod +x infrastructure/seeds/seed-data.sh

# Deploy
./deploy.sh
```

## 🔄 CI/CD Deployment

### GitHub Actions Setup

1. **Repository Secrets** (Settings → Secrets and variables → Actions):
   ```
   DEPLOY_HOST=your-domain.com
   DEPLOY_USER=deploy
   DEPLOY_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
   SLACK_WEBHOOK=https://hooks.slack.com/services/...
   ```

2. **Deploy on Push**:
   ```bash
   git push main
   ```

3. **Manual Deploy**:
   ```bash
   # Create workflow dispatch
   gh workflow run deploy.yml
   ```

### CI/CD Features

- ✅ Automated testing
- ✅ Docker image building
- ✅ Zero-downtime deployment
- ✅ Health checks
- ✅ Rollback on failure
- ✅ Slack notifications

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|-----------|-----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `REDIS_PASSWORD` | ✅ | Redis password |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh secret |
| `FRONTEND_URL` | ✅ | Frontend URL |
| `CORS_ORIGIN` | ✅ | CORS allowed origin |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth client secret |
| `SMTP_HOST` | ❌ | SMTP server |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |

### SSL Configuration

#### Automatic (Let's Encrypt)

```bash
# SSL is automatically configured during deployment
# Certificates are renewed automatically
```

#### Manual SSL

```bash
# Place certificates in infrastructure/ssl/
# cert.pem - SSL certificate
# private.key - Private key
```

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service
curl https://your-domain.com/health
```

### Monitoring Scripts

```bash
# Manual monitoring
sudo /usr/local/bin/minizapier-monitor

# View monitoring logs
tail -f /var/log/minizapier-monitor.log
```

### Metrics

- **Service Health**: Every 5 minutes
- **Disk Usage**: Alert at 80%
- **Memory Usage**: Alert at 85%
- **Auto-restart**: Unhealthy services

## 💾 Backup & Recovery

### Automated Backups

```bash
# Manual backup
sudo /usr/local/bin/minizapier-backup

# View backup location
ls -la /opt/backups/minizapier/
```

### Backup Schedule

- **Frequency**: Daily at 2:00 AM
- **Retention**: 30 days
- **Location**: `/opt/backups/minizapier/`
- **Format**: Compressed tar.gz

### Recovery

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres < backup.sql

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security

### Firewall (UFW)

```bash
# Check firewall status
sudo ufw status

# Allow additional ports
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
```

### Fail2Ban

```bash
# Check fail2ban status
sudo fail2ban-client status

# View banned IPs
sudo fail2ban-client status sshd
```

### Security Headers

All HTTP responses include security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy

### SSL/TLS

- TLS 1.2 and 1.3 supported
- Automatic certificate renewal
- Strong cipher suites
- HSTS enabled

## 🔧 Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api-gateway

# Check system resources
htop
df -h
free -h
```

#### 2. Database Connection Issues

```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

#### 3. SSL Certificate Issues

```bash
# Check certificate
openssl s_client -connect your-domain.com:443

# Renew certificate
sudo certbot renew
```

#### 4. High Memory Usage

```bash
# Check memory usage
free -h
docker stats

# Clean up Docker
docker system prune -f
```

### Log Locations

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f

# System logs
sudo journalctl -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Monitoring logs
tail -f /var/log/minizapier-monitor.log
```

### Performance Tuning

#### Database Optimization

```bash
# PostgreSQL tuning
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "ALTER SYSTEM SET shared_buffers = '256MB';"
```

#### Nginx Optimization

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo nginx -s reload
```

## 📱 Scaling

### Horizontal Scaling

```bash
# Scale specific services
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3 --scale auth-service=2
```

### Load Balancing

Nginx automatically load balances between service instances.

### Database Scaling

For high-load scenarios, consider:
- PostgreSQL read replicas
- Redis clustering
- Connection pooling

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Redeploy
./deploy.sh
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Security Updates

```bash
# Check for security updates
sudo unattended-upgrades --dry-run

# Install security updates
sudo apt-get install -y --only-upgrade $(apt-get -s | grep -i security | awk '{print $2}')
```

## 📞 Support

### Getting Help

1. **Check Logs**: Always check application and system logs first
2. **Health Checks**: Verify all services are healthy
3. **Documentation**: Refer to this guide and API documentation
4. **Community**: Check GitHub issues and discussions

### Emergency Contacts

- **System Administrator**: Contact your hosting provider
- **Application Support**: Create GitHub issue with detailed information
- **Security Issues**: Report security vulnerabilities privately

## 📚 Additional Resources

- [API Documentation](https://your-domain.com/api/docs)
- [User Guide](https://your-domain.com/docs)
- [Development Guide](./DEVELOPMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

---

**🎉 Congratulations! Your mini-Zapier platform is now running in production!**

For additional help or questions, please refer to the troubleshooting section or create an issue on GitHub.
