# Workflow Service

⚙️ **Workflow Management Service for mini-Zapier Platform**

## Overview

The Workflow Service is responsible for creating, managing, and executing automated workflows in the mini-Zapier platform. It provides a visual graph-based workflow system with triggers and actions.

## Features

### 🔧 **Workflow Management**
- **Create Workflows** - Visual workflow builder with drag-and-drop nodes
- **JSON Graph Storage** - Workflow structure stored as nodes and edges
- **Validation** - Comprehensive workflow structure validation
- **Version Control** - Track workflow changes and history

### 🎯 **Node Types**

#### Trigger Nodes
- **Webhook** - HTTP endpoint triggers
- **Cron** - Scheduled triggers
- **Email** - Email-based triggers
- **Manual** - Manual execution triggers

#### Action Nodes
- **HTTP Request** - Call external APIs
- **Send Email** - Email notifications
- **Telegram Message** - Bot notifications
- **Database Query** - Database operations
- **Data Transform** - Data manipulation
- **Webhook** - Send webhook calls

### 🔄 **Workflow Operations**
- **Activate/Pause** - Control workflow execution
- **Clone** - Duplicate workflows
- **Validate** - Check workflow structure
- **Executions** - Track workflow run history

## API Endpoints

### Workflow Management
```
POST   /workflows              # Create new workflow
GET    /workflows              # List user workflows
GET    /workflows/:id          # Get workflow details
PATCH  /workflows/:id          # Update workflow
DELETE /workflows/:id          # Delete workflow
```

### Workflow Control
```
POST   /workflows/:id/activate # Activate workflow
POST   /workflows/:id/pause    # Pause workflow
POST   /workflows/:id/clone    # Clone workflow
```

### Workflow Analysis
```
GET    /workflows/:id/validate # Validate workflow
GET    /workflows/:id/executions # Get execution history
```

### Health
```
GET    /health                 # Service health check
GET    /health/ready           # Service readiness
```

## Database Schema

### Workflow Model
```sql
Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  status      WorkflowStatus @default(DRAFT)
  trigger     Json     // Trigger configuration
  nodes       Json     // Workflow nodes array
  edges       Json     // Workflow edges array
  settings    Json?    // Additional settings
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Workflow Execution Model
```sql
WorkflowExecution {
  id          String   @id @default(cuid())
  workflowId  String
  status      ExecutionStatus @default(PENDING)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  error       String?
  logs        Json?
  metadata    Json?
}
```

### Enums
```sql
WorkflowStatus: DRAFT | ACTIVE | PAUSED | ARCHIVED
ExecutionStatus: PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
```

## Workflow Structure

### Node Structure
```json
{
  "id": "node_123",
  "type": "trigger|action",
  "nodeType": "webhook|http_request|...",
  "name": "Node Name",
  "config": {
    // Node-specific configuration
  },
  "position": {
    "x": 100,
    "y": 200
  }
}
```

### Edge Structure
```json
{
  "id": "edge_123",
  "source": "node_123",
  "target": "node_456",
  "condition": {
    "field": "status",
    "operator": "equals",
    "value": "success"
  }
}
```

### Complete Workflow Example
```json
{
  "name": "Process New Orders",
  "description": "Handle new e-commerce orders",
  "trigger": {
    "type": "webhook",
    "config": {
      "url": "/new-order",
      "method": "POST"
    }
  },
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger",
      "nodeType": "webhook",
      "name": "New Order Webhook",
      "config": { "url": "/new-order" },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "action_1",
      "type": "action",
      "nodeType": "http_request",
      "name": "Update Inventory",
      "config": {
        "url": "https://api.inventory.com/update",
        "method": "POST"
      },
      "position": { "x": 300, "y": 100 }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "trigger_1",
      "target": "action_1"
    }
  ]
}
```

## Configuration

### Environment Variables
```bash
# Service Configuration
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/minizapier_workflows

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h

# Redis
REDIS_URL=redis://localhost:6379

# External Services
EXECUTION_SERVICE_URL=http://localhost:3003
TRIGGER_SERVICE_URL=http://localhost:3004
ACTION_SERVICE_URL=http://localhost:3005

# Workflow Settings
MAX_WORKFLOW_NODES=50
MAX_WORKFLOW_EDGES=100
WORKFLOW_TIMEOUT=300000

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
docker build -t workflow-service .

# Run with Docker Compose
docker-compose -f ../../infrastructure/docker-compose.yml up workflow-service
```

## Usage Examples

### Create Workflow
```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Process New Orders",
    "description": "Handle new e-commerce orders",
    "userId": "user_123",
    "trigger": {
      "type": "webhook",
      "config": { "url": "/new-order" }
    },
    "nodes": [
      {
        "id": "trigger_1",
        "type": "trigger",
        "nodeType": "webhook",
        "name": "New Order Webhook",
        "config": { "url": "/new-order" },
        "position": { "x": 100, "y": 100 }
      }
    ]
  }'
```

### Get Workflows
```bash
curl -X GET "http://localhost:3002/workflows?userId=user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Activate Workflow
```bash
curl -X POST http://localhost:3002/workflows/workflow_123/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Validate Workflow
```bash
curl -X GET http://localhost:3002/workflows/workflow_123/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Workflow Validation

The service performs comprehensive validation:

### Structure Validation
- ✅ Exactly one trigger node
- ✅ Valid node types and configurations
- ✅ Proper node connections
- ✅ No duplicate node IDs
- ✅ Valid positions

### Connectivity Validation
- ✅ All action nodes reachable from trigger
- ✅ No cycles in workflow graph
- ✅ Valid edge connections

### Configuration Validation
- ✅ Required trigger configuration
- ✅ Valid node configurations
- ✅ Proper data flow between nodes

## Node Configurations

### Webhook Trigger
```json
{
  "type": "webhook",
  "config": {
    "url": "/webhook-endpoint",
    "method": "POST",
    "headers": {},
    "security": "none|api_key|oauth"
  }
}
```

### Cron Trigger
```json
{
  "type": "cron",
  "config": {
    "expression": "0 */5 * * *",
    "timezone": "UTC"
  }
}
```

### HTTP Request Action
```json
{
  "type": "http_request",
  "config": {
    "url": "https://api.example.com/endpoint",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{{trigger.data}}",
    "timeout": 30000
  }
}
```

### Send Email Action
```json
{
  "type": "send_email",
  "config": {
    "to": "user@example.com",
    "subject": "Workflow Notification",
    "body": "Workflow executed successfully",
    "template": "html|text"
  }
}
```

## Error Handling

### Validation Errors
```json
{
  "statusCode": 400,
  "message": "Invalid workflow structure",
  "errors": [
    "Workflow must have exactly one trigger node",
    "Action node 'Send Email' is not reachable from trigger"
  ]
}
```

### Conflict Errors
```json
{
  "statusCode": 409,
  "message": "Workflow with this name already exists"
}
```

### Not Found Errors
```json
{
  "statusCode": 404,
  "message": "Workflow not found"
}
```

## Monitoring & Logging

### Health Checks
```bash
# Basic health check
curl http://localhost:3002/health

# Readiness check
curl http://localhost:3002/health/ready
```

### Structured Logging
```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "workflow-service",
  "message": "Workflow created successfully",
  "workflowId": "workflow_123",
  "userId": "user_123"
}
```

### Performance Metrics
- Request/response times
- Database query performance
- Workflow validation times
- Error rates by endpoint

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

### Test Coverage
- Workflow validation logic
- CRUD operations
- Edge case handling
- Error scenarios

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
docker build -t workflow-service:latest .

# Run with environment variables
docker run -d \
  --name workflow-service \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  workflow-service:latest
```

## Architecture

### Service Structure
```
src/
├── workflow/              # Workflow logic
│   ├── workflow.controller.ts  # API endpoints
│   ├── workflow.service.ts     # Business logic
│   ├── jwt-auth.guard.ts       # JWT middleware
│   └── workflow.module.ts      # Workflow module
├── config/                 # Configuration services
│   ├── prisma.service.ts   # Database service
│   └── prisma.module.ts     # Database module
├── dto/                    # Data transfer objects
├── health/                 # Health checks
└── app.module.ts           # Main module
```

### Dependencies
- **NestJS** - Application framework
- **Prisma** - Database ORM
- **JWT** - Authentication tokens
- **class-validator** - Input validation
- **class-transformer** - Data transformation
- **Winston** - Logging
- **Swagger** - API documentation

## Troubleshooting

### Common Issues

**Database Connection Error**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists: `minizapier_workflows`

**Validation Errors**
- Check workflow structure
- Ensure exactly one trigger node
- Verify all nodes are connected

**Performance Issues**
- Check database query performance
- Monitor workflow validation times
- Review Redis connection status

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## License

MIT License - see LICENSE file for details.
