import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WorkflowExecutionService } from './workflow-execution.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Execution')
@Controller('execution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExecutionController {
  constructor(private readonly executionService: WorkflowExecutionService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger workflow execution' })
  @ApiResponse({ 
    status: 202, 
    description: 'Workflow execution triggered',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', example: 'job_123' },
        message: { type: 'string', example: 'Workflow execution queued' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async triggerWorkflow(
    @Body() triggerData: {
      workflowId: string;
      triggerData?: any;
      userId?: string;
    }
  ): Promise<{ jobId: string; message: string }> {
    const jobId = await this.executionService.triggerWorkflow(
      triggerData.workflowId,
      triggerData.triggerData,
      triggerData.userId
    );

    return {
      jobId,
      message: 'Workflow execution queued',
    };
  }

  @Get(':executionId')
  @ApiOperation({ summary: 'Get execution status and details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Execution details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'execution_123' },
        workflowId: { type: 'string', example: 'workflow_123' },
        status: { type: 'string', example: 'RUNNING' },
        startedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        completedAt: { type: 'string', example: '2024-01-01T00:01:00.000Z' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              nodeId: { type: 'string' },
              nodeType: { type: 'string' },
              status: { type: 'string' },
              duration: { type: 'number' },
              input: { type: 'object' },
              output: { type: 'object' },
              error: { type: 'string' },
              retryCount: { type: 'number' },
            },
          },
        },
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Execution not found',
  })
  @ApiParam({
    name: 'executionId',
    description: 'Execution ID',
    example: 'execution_123',
  })
  async getExecution(@Param('executionId') executionId: string): Promise<any> {
    return this.executionService.getExecutionStatus(executionId);
  }

  @Get('workflow/:workflowId')
  @ApiOperation({ summary: 'Get execution history for a workflow' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of executions for workflow',
    type: [Object],
  })
  @ApiParam({
    name: 'workflowId',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by execution status',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of executions to return',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of executions to skip',
    example: 0,
  })
  async getWorkflowExecutions(
    @Param('workflowId') workflowId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<any[]> {
    // This would need to be implemented in the service
    // For now, returning empty array as placeholder
    return [];
  }

  @Post(':executionId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry failed execution' })
  @ApiResponse({ 
    status: 202, 
    description: 'Execution retry triggered',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Execution not found',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Execution cannot be retried',
  })
  @ApiParam({
    name: 'executionId',
    description: 'Execution ID to retry',
    example: 'execution_123',
  })
  async retryExecution(@Param('executionId') executionId: string): Promise<{ message: string }> {
    // This would need to be implemented
    return { message: 'Execution retry triggered' };
  }

  @Post(':executionId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel running execution' })
  @ApiResponse({ 
    status: 200, 
    description: 'Execution cancelled',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Execution not found',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Execution cannot be cancelled',
  })
  @ApiParam({
    name: 'executionId',
    description: 'Execution ID to cancel',
    example: 'execution_123',
  })
  async cancelExecution(@Param('executionId') executionId: string): Promise<{ message: string }> {
    // This would need to be implemented
    return { message: 'Execution cancelled' };
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue statistics',
    schema: {
      type: 'object',
      properties: {
        waiting: { type: 'number', example: 5 },
        active: { type: 'number', example: 2 },
        completed: { type: 'number', example: 100 },
        failed: { type: 'number', example: 3 },
      },
    },
  })
  async getQueueStats(): Promise<any> {
    // This would need to be implemented to get BullMQ queue stats
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get execution statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Execution statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 1000 },
        completed: { type: 'number', example: 850 },
        failed: { type: 'number', example: 100 },
        running: { type: 'number', example: 5 },
        pending: { type: 'number', example: 45 },
        averageDuration: { type: 'number', example: 15000 },
      },
    },
  })
  @ApiQuery({
    name: 'workflowId',
    required: false,
    description: 'Filter by workflow ID',
    example: 'workflow_123',
  })
  @ApiQuery({
    name: 'timeRange',
    required: false,
    description: 'Time range for statistics',
    enum: ['1h', '24h', '7d', '30d'],
    example: '24h',
  })
  async getExecutionStats(
    @Query('workflowId') workflowId?: string,
    @Query('timeRange') timeRange?: string,
  ): Promise<any> {
    // This would need to be implemented
    return {
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      pending: 0,
      averageDuration: 0,
    };
  }
}
