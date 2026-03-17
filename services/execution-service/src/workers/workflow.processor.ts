import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { WorkflowExecutionService } from '../execution/workflow-execution.service';
import { PrismaService } from '../config/prisma.service';

export interface WorkflowJobData {
  workflowId: string;
  triggerData?: any;
  executionId?: string;
  userId?: string;
}

@Injectable()
@Processor('workflow-execution')
export class WorkflowProcessor implements OnModuleInit {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(
    private workflowExecutionService: WorkflowExecutionService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Workflow processor initialized');
  }

  @Process('execute-workflow')
  async executeWorkflow(job: Job<WorkflowJobData>) {
    const { workflowId, triggerData, executionId, userId } = job.data;
    
    this.logger.log(`Processing workflow execution job: ${job.id}, workflow: ${workflowId}`);
    
    try {
      // Execute the workflow
      const result = await this.workflowExecutionService.executeWorkflow({
        workflowId,
        triggerData,
        executionId,
        userId,
      });

      this.logger.log(`Workflow execution completed: ${result.execution.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      
      // Update execution status to failed
      if (executionId) {
        await this.prisma.execution.update({
          where: { id: executionId },
          data: {
            status: 'FAILED',
            error: error.message,
            completedAt: new Date(),
          },
        });
      }
      
      throw error;
    }
  }

  @Process('retry-workflow-step')
  async retryWorkflowStep(job: Job<{ executionId: string; stepId: string }>) {
    const { executionId, stepId } = job.data;
    
    this.logger.log(`Retrying workflow step: ${stepId}, execution: ${executionId}`);
    
    try {
      const result = await this.workflowExecutionService.retryStep(executionId, stepId);
      this.logger.log(`Step retry completed: ${stepId}`);
      return result;
    } catch (error) {
      this.logger.error(`Step retry failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
