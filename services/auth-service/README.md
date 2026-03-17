# Auth Service

🔐 **Authentication Service for mini-Zapier Platform**

## Overview

The Auth Service is responsible for user authentication, authorization, and session management in the mini-Zapier platform. It provides JWT-based authentication with OAuth integration for Google and GitHub.

## Features

### 🔑 Authentication Methods
- **Email & Password** - Traditional registration and login
- **Google OAuth** - Sign in with Google account
- **GitHub OAuth** - Sign in with GitHub account

### 🛡️ Security Features
- **JWT Access Tokens** - Short-lived tokens (1 hour)
- **Refresh Tokens** - Long-lived tokens (7 days)
- **Email Verification** - Required for email registration
- **Rate Limiting** - Protection against brute force attacks
- **Password Hashing** - bcrypt for secure password storage

### 📧 Email Services
- **Verification Emails** - HTML templates for email verification
- **Password Reset** - Secure password reset functionality
- **SMTP Integration** - Configurable email provider

### 📊 Monitoring
- **Health Checks** - `/health` and `/health/ready` endpoints
- **Structured Logging** - Winston logger with JSON format
- **Swagger Documentation** - API documentation at `/api`

## API Endpoints

### Authentication
```
POST   /auth/register          # Register new user
POST   /auth/login             # Login with email/password
POST   /auth/refresh           # Refresh access token
POST   /auth/verify-email      # Verify email address
POST   /auth/logout            # Logout user
```

### OAuth
```
GET    /auth/google            # Initiate Google OAuth
GET    /auth/google/callback   # Google OAuth callback
GET    /auth/github            # Initiate GitHub OAuth
GET    /auth/github/callback   # GitHub OAuth callback
```

### User Management
```
GET    /auth/profile           # Get user profile (JWT required)
GET    /auth/verify-token      # Verify JWT token
```

### Health
```
GET    /health                 # Service health check
GET    /health/ready           # Service readiness check
```

## Database Schema

### User Model
```sql
User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String?   // For email registration
  name              String?
  avatar            String?
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### Related Models
- **EmailVerification** - Email verification codes
- **OAuthAccount** - OAuth provider accounts
- **RefreshToken** - JWT refresh tokens
- **Session** - User sessions

## Configuration

### Environment Variables
```bash
# Service Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/minizapier_auth

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_URL=redis://localhost:6379

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=mini-Zapier <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3007

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional)

### Local Development
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Docker Development
```bash
# Build image
docker build -t auth-service .

# Run with Docker Compose
docker-compose -f ../../infrastructure/docker-compose.yml up auth-service
```

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Verify Email
```bash
curl -X POST http://localhost:3001/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Get Profile (JWT Required)
```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## OAuth Integration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3001/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## Rate Limiting

The service implements rate limiting to prevent abuse:

- **Register**: 5 requests per minute
- **Login**: 10 requests per minute  
- **Refresh Token**: 20 requests per minute
- **OAuth**: 5 requests per minute
- **Default**: 100 requests per minute

## Security Best Practices

### JWT Tokens
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Tokens are stored in database for revocation
- Refresh tokens are single-use

### Password Security
- Passwords are hashed with bcrypt (10 rounds)
- Minimum password length: 6 characters
- Password strength validation recommended

### Email Verification
- Verification codes expire after 15 minutes
- Codes are stored in Redis for fast access
- HTML email templates for better UX

### OAuth Security
- State parameter for CSRF protection
- Token validation and expiration handling
- Automatic account linking for existing users

## Monitoring & Logging

### Health Checks
```bash
# Basic health check
curl http://localhost:3001/health

# Readiness check (for Kubernetes)
curl http://localhost:3001/health/ready
```

### Logging
- Structured JSON logging
- Error and info logs to files
- Request/response logging for debugging
- Performance metrics

### Swagger Documentation
Visit `http://localhost:3001/api` for interactive API documentation.

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Integration Tests
```bash
# Run integration tests
npm run test:e2e
```

## Deployment

### Production Build
```bash
# Build application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment
```bash
# Build production image
docker build -t auth-service:latest .

# Run with environment variables
docker run -d \
  --name auth-service \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  auth-service:latest
```

## Architecture

### Service Structure
```
src/
├── auth/                  # Authentication logic
│   ├── auth.controller.ts # API endpoints
│   ├── auth.service.ts    # Business logic
│   ├── email.service.ts   # Email functionality
│   ├── oauth.strategy.ts  # OAuth strategies
│   └── jwt-auth.guard.ts  # JWT middleware
├── config/                # Configuration services
│   ├── prisma.service.ts  # Database service
│   └── redis.service.ts   # Redis service
├── dto/                   # Data transfer objects
├── health/                # Health checks
└── app.module.ts          # Main module
```

### Dependencies
- **NestJS** - Application framework
- **Prisma** - Database ORM
- **Redis** - Session storage and caching
- **JWT** - Token authentication
- **Passport** - OAuth strategies
- **Nodemailer** - Email sending
- **Winston** - Logging
- **class-validator** - Input validation

## Troubleshooting

### Common Issues

**Database Connection Error**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists: `minizapier_auth`

**Redis Connection Error**
- Check REDIS_URL in .env
- Ensure Redis is running
- Test connection: `redis-cli ping`

**Email Sending Error**
- Verify SMTP credentials
- Check email provider settings
- Ensure less secure apps access (Gmail)

**OAuth Callback Error**
- Verify OAuth app configuration
- Check callback URLs match exactly
- Ensure client ID/secret are correct

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.
