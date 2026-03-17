# Execution Service

⚡ **Workflow Execution Service for mini-Zapier Platform**

## Overview

The Execution Service is responsible for executing workflows in the mini-Zapier platform. It uses BullMQ for job queuing and Redis for reliable background processing with retry mechanisms and comprehensive logging.

## Features

### 🔄 **Workflow Execution**
- **BullMQ Queue System** - Reliable job processing with Redis
- **Graph-based Execution** - Follows workflow node connections
- **Parallel Processing** - Multiple concurrent executions
- **Error Handling** - Retry logic with exponential backoff
- **Real-time Monitoring** - Track execution status and progress

### 📊 **Execution Tracking**
- **Execution Records** - Complete execution history
- **Step-by-step Logging** - Detailed node execution logs
- **Performance Metrics** - Duration and timing information
- **Error Tracking** - Comprehensive error logging
- **Retry Management** - Automatic retry with configurable limits

### 🛠️ **Node Execution**
- **HTTP Request Actions** - Call external APIs
- **Email Sending** - SMTP email notifications
- **Telegram Messages** - Bot notifications
- **Data Transformation** - Process and transform data
- **Webhook Calls** - Send webhook notifications

### 📈 **Monitoring & Management**
- **Queue Statistics** - Monitor queue health and performance
- **Execution Analytics** - Success rates and performance metrics
- **Health Checks** - Service and database connectivity
- **Real-time Status** - Live execution tracking

## Architecture

### Execution Flow
```
Trigger → BullMQ Queue → Worker → Workflow Execution → Step-by-step Processing → Results
```

### Data Models
- **Execution** - Main execution record
- **ExecutionStep** - Individual node execution
- **ExecutionLog** - Detailed logging
- **BullMQ Jobs** - Queue management

## API Endpoints

### Execution Management
```
POST   /execution/trigger          # Trigger workflow execution
GET    /execution/:executionId      # Get execution details
GET    /execution/workflow/:workflowId # Get workflow execution history
POST   /execution/:executionId/retry  # Retry failed execution
POST   /execution/:executionId/cancel # Cancel running execution
```

### Monitoring
```
GET    /execution/queue/stats       # Queue statistics
GET    /execution/stats             # Execution statistics
GET    /health                       # Service health check
GET    /health/ready                 # Service readiness check
```

## Database Schema

### Execution Model
```sql
Execution {
  id          String   @id @default(cuid())
  workflowId  String
  status      ExecutionStatus @default(PENDING)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  error       String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ExecutionStep Model
```sql
ExecutionStep {
  id            String   @id @default(cuid())
  executionId   String
  nodeId        String   // Workflow node ID
  nodeType      String   // "trigger" | "action"
  status        ExecutionStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?
  duration      Int?     // Duration in ms
  input         Json?
  output        Json?
  error         String?
  retryCount    Int      @default(0)
  maxRetries    Int      @default(3)
}
```

### ExecutionLog Model
```sql
ExecutionLog {
  id          String   @id @default(cuid())
  executionId String
  stepId      String?
  level       LogLevel @default(INFO)
  message     String
  data        Json?
  timestamp   DateTime @default(now())
}
```

### Enums
```sql
ExecutionStatus: PENDING | RUNNING | COMPLETED | FAILED | CANCELLED | RETRYING
LogLevel: DEBUG | INFO | WARN | ERROR
```

## BullMQ Configuration

### Queue Setup
```javascript
{
  name: 'workflow-execution',
  redis: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}
```

### Job Types
- **execute-workflow** - Main workflow execution job
- **retry-workflow-step** - Retry failed step execution

## Configuration

### Environment Variables
```bash
# Service Configuration
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/minizapier_executions

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h

# External Services
WORKFLOW_SERVICE_URL=http://localhost:3002
ACTION_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006

# BullMQ Configuration
BULLMQ_REDIS_HOST=localhost
BULLMQ_REDIS_PORT=6379
BULLMQ_DEFAULT_JOB_OPTIONS_ATTEMPTS=3
BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF_TYPE=exponential
BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF_DELAY=2000

# Execution Settings
MAX_CONCURRENT_EXECUTIONS=10
EXECUTION_TIMEOUT=300000
STEP_TIMEOUT=60000
MAX_RETRIES=3

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
docker build -t execution-service .

# Run with Docker Compose
docker-compose -f ../../infrastructure/docker-compose.yml up execution-service
```

## Usage Examples

### Trigger Workflow Execution
```bash
curl -X POST http://localhost:3003/execution/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "workflowId": "workflow_123",
    "triggerData": {
      "email": "user@example.com",
      "amount": 100
    },
    "userId": "user_123"
  }'
```

### Get Execution Status
```bash
curl -X GET http://localhost:3003/execution/execution_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Queue Statistics
```bash
curl -X GET http://localhost:3003/execution/queue/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Retry Failed Execution
```bash
curl -X POST http://localhost:3003/execution/execution_123/retry \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Execution Flow

### 1. Trigger
```javascript
// Trigger service adds job to queue
await executionQueue.add('execute-workflow', {
  workflowId: 'workflow_123',
  triggerData: { email: 'user@example.com' },
  userId: 'user_123'
});
```

### 2. Worker Processing
```javascript
// Worker processes job
@Process('execute-workflow')
async executeWorkflow(job: Job<WorkflowJobData>) {
  const { workflowId, triggerData } = job.data;
  
  // Get workflow
  const workflow = await getWorkflow(workflowId);
  
  // Create execution record
  const execution = await createExecution(workflowId);
  
  // Execute workflow nodes
  await executeWorkflowNodes(workflow, execution, triggerData);
  
  // Update execution status
  await updateExecutionStatus(execution.id, 'COMPLETED');
}
```

### 3. Node Execution
```javascript
// Execute individual node
async executeNode(node, execution, input) {
  const startTime = Date.now();
  
  // Create execution step
  const step = await createExecutionStep(execution.id, node.id);
  
  try {
    // Execute based on node type
    let output;
    switch (node.nodeType) {
      case 'http_request':
        output = await executeHttpRequestNode(node, input);
        break;
      case 'send_email':
        output = await executeEmailNode(node, input);
        break;
      // ... other node types
    }
    
    // Update step with success
    await updateExecutionStep(step.id, {
      status: 'COMPLETED',
      output,
      duration: Date.now() - startTime
    });
    
    return output;
  } catch (error) {
    // Handle retry logic
    if (step.retryCount < step.maxRetries) {
      await scheduleRetry(step.id);
    } else {
      throw error; // Max retries reached
    }
  }
}
```

## Error Handling & Retry Logic

### Retry Strategy
- **Exponential Backoff**: 2^n * 2000ms delay
- **Max Retries**: 3 attempts per step
- **Retry Conditions**: Network errors, timeouts, temporary failures
- **Failure Notification**: Automatic notification on max retries

### Error Types
```javascript
// Network errors - retry
if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
  return scheduleRetry();
}

// Business logic errors - fail immediately
if (error.message.includes('Invalid data')) {
  throw error;
}

// Temporary service errors - retry
if (error.response?.status >= 500) {
  return scheduleRetry();
}
```

## Logging & Monitoring

### Structured Logging
```javascript
// Execution log
{
  "level": "INFO",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "execution-service",
  "executionId": "execution_123",
  "stepId": "step_456",
  "message": "Node completed successfully",
  "data": {
    "duration": 1500,
    "nodeType": "http_request"
  }
}
```

### Performance Metrics
- **Execution Duration**: Total execution time
- **Step Duration**: Individual node execution time
- **Queue Wait Time**: Time spent in queue
- **Success Rate**: Percentage of successful executions
- **Error Rate**: Percentage of failed executions

## Monitoring

### Health Checks
```bash
# Basic health check
curl http://localhost:3003/health

# Readiness check
curl http://localhost:3003/health/ready
```

### Queue Monitoring
```bash
# Get queue statistics
curl http://localhost:3003/execution/queue/stats

# Response example
{
  "waiting": 5,
  "active": 2,
  "completed": 100,
  "failed": 3,
  "delayed": 1
}
```

### Execution Statistics
```bash
# Get execution statistics
curl http://localhost:3003/execution/stats?timeRange=24h

# Response example
{
  "total": 1000,
  "completed": 850,
  "failed": 100,
  "running": 5,
  "pending": 45,
  "averageDuration": 15000
}
```

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
- Workflow execution logic
- Error handling and retry
- Queue operations
- Database operations
- External service integrations

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
docker build -t execution-service:latest .

# Run with environment variables
docker run -d \
  --name execution-service \
  -p 3003:3003 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=your-secret \
  execution-service:latest
```

### Scaling Considerations
- **Horizontal Scaling**: Multiple worker instances
- **Queue Partitioning**: Separate queues for different priorities
- **Database Optimization**: Indexing for execution queries
- **Redis Clustering**: For high-volume queue processing

## Architecture

### Service Structure
```
src/
├── execution/              # Execution logic
│   ├── execution.controller.ts  # API endpoints
│   ├── workflow-execution.service.ts  # Core execution logic
│   ├── jwt-auth.guard.ts       # JWT middleware
│   └── execution.module.ts      # Execution module
├── workers/                 # BullMQ workers
│   ├── workflow.processor.ts  # Workflow job processor
│   └── bull.module.ts         # BullMQ configuration
├── config/                  # Configuration services
│   ├── prisma.service.ts     # Database service
│   └── prisma.module.ts       # Database module
├── health/                  # Health checks
└── app.module.ts            # Main module
```

### Dependencies
- **NestJS** - Application framework
- **BullMQ** - Job queue system
- **Redis** - Queue storage and caching
- **Prisma** - Database ORM
- **JWT** - Authentication tokens
- **Axios** - HTTP client for external services
- **Winston** - Logging
- **Swagger** - API documentation

## Troubleshooting

### Common Issues

**Queue Processing Stopped**
- Check Redis connection
- Verify BullMQ worker status
- Check for failed jobs

**Database Connection Error**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists: `minizapier_executions`

**High Execution Failure Rate**
- Check external service availability
- Review error logs for patterns
- Verify workflow configurations

**Memory Usage High**
- Monitor queue size
- Check for stuck jobs
- Review execution logs

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run start:dev
```

## Performance Optimization

### Queue Optimization
- **Job Priority**: High priority for critical workflows
- **Batch Processing**: Group similar operations
- **Delayed Jobs**: Schedule non-urgent executions
- **Job Concurrency**: Limit concurrent executions

### Database Optimization
- **Indexing**: Proper indexes on execution queries
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Efficient execution queries
- **Data Retention**: Archive old execution data

### Memory Management
- **Job Cleanup**: Remove completed/failed jobs
- **Log Rotation**: Manage log file sizes
- **Cache Management**: Optimize Redis memory usage
- **Resource Limits**: Set appropriate memory limits

## Contributing

1. Fork the repository
2. Create feature branch
3. Add comprehensive tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.
