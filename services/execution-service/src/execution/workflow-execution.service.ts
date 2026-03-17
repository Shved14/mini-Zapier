import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpService } from '@nestjs/axios';

export interface WorkflowExecutionOptions {
  workflowId: string;
  triggerData?: any;
  executionId?: string;
  userId?: string;
}

export interface ExecutionResult {
  execution: any;
  success: boolean;
  error?: string;
}

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('workflow-execution') private workflowQueue: Queue,
    private httpService: HttpService,
  ) {}

  async executeWorkflow(options: WorkflowExecutionOptions): Promise<ExecutionResult> {
    const { workflowId, triggerData, executionId, userId } = options;
    
    try {
      // Get workflow from Workflow Service
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Create or get execution
      let execution;
      if (executionId) {
        execution = await this.prisma.execution.findUnique({
          where: { id: executionId },
        });
        if (!execution) {
          throw new Error('Execution not found');
        }
      } else {
        execution = await this.createExecution(workflowId, userId);
      }

      // Update execution status to running
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: { status: 'RUNNING' },
      });

      // Log execution start
      await this.logExecution(execution.id, 'INFO', 'Workflow execution started', {
        workflowId,
        triggerData,
      });

      // Execute workflow nodes in order
      const result = await this.executeWorkflowNodes(workflow, execution, triggerData);

      // Update execution status
      const finalStatus = result.success ? 'COMPLETED' : 'FAILED';
      await this.prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: finalStatus,
          error: result.error,
          completedAt: new Date(),
        },
      });

      // Log completion
      await this.logExecution(execution.id, 'INFO', `Workflow execution ${finalStatus.toLowerCase()}`);

      // Send notification if failed
      if (!result.success) {
        await this.sendFailureNotification(execution, result.error);
      }

      return {
        execution,
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      
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

      return {
        execution: executionId ? { id: executionId } : null,
        success: false,
        error: error.message,
      };
    }
  }

  private async getWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await this.httpService.get(
        `${process.env.WORKFLOW_SERVICE_URL}/workflows/${workflowId}`
      ).toPromise();
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch workflow ${workflowId}: ${error.message}`);
      return null;
    }
  }

  private async createExecution(workflowId: string, userId?: string): Promise<any> {
    return this.prisma.execution.create({
      data: {
        workflowId,
        status: 'PENDING',
        metadata: userId ? { userId } : {},
      },
    });
  }

  private async executeWorkflowNodes(workflow: any, execution: any, triggerData?: any): Promise<{ success: boolean; error?: string }> {
    const { nodes, edges } = workflow;
    
    if (!nodes || nodes.length === 0) {
      return { success: false, error: 'Workflow has no nodes' };
    }

    // Find trigger node
    const triggerNode = nodes.find(node => node.type === 'trigger');
    if (!triggerNode) {
      return { success: false, error: 'Workflow has no trigger node' };
    }

    // Build execution graph
    const executionGraph = this.buildExecutionGraph(nodes, edges);
    
    // Execute nodes starting from trigger
    const visitedNodes = new Set<string>();
    const nodeResults = new Map<string, any>();

    try {
      await this.executeNode(triggerNode, execution, triggerData, nodeResults);
      visitedNodes.add(triggerNode.id);

      // Execute connected nodes
      await this.executeConnectedNodes(
        triggerNode.id,
        executionGraph,
        execution,
        visitedNodes,
        nodeResults
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private buildExecutionGraph(nodes: any[], edges: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize all nodes
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    // Add edges
    edges.forEach(edge => {
      const targets = graph.get(edge.source) || [];
      targets.push(edge.target);
      graph.set(edge.source, targets);
    });

    return graph;
  }

  private async executeConnectedNodes(
    nodeId: string,
    graph: Map<string, string[]>,
    execution: any,
    visitedNodes: Set<string>,
    nodeResults: Map<string, any>
  ): Promise<void> {
    const connectedNodes = graph.get(nodeId) || [];
    
    for (const targetNodeId of connectedNodes) {
      if (!visitedNodes.has(targetNodeId)) {
        const targetNode = this.findNodeById(targetNodeId);
        if (targetNode) {
          const input = this.prepareNodeInput(targetNodeId, graph, nodeResults);
          await this.executeNode(targetNode, execution, input, nodeResults);
          visitedNodes.add(targetNodeId);
          
          // Recursively execute connected nodes
          await this.executeConnectedNodes(targetNodeId, graph, execution, visitedNodes, nodeResults);
        }
      }
    }
  }

  private findNodeById(nodeId: string): any {
    // This would need to fetch the workflow nodes or have them cached
    // For now, returning null as placeholder
    return null;
  }

  private prepareNodeInput(nodeId: string, graph: Map<string, string[]>, nodeResults: Map<string, any>): any {
    // Prepare input for node based on previous node results
    const sources = Array.from(graph.entries())
      .filter(([_, targets]) => targets.includes(nodeId))
      .map(([source]) => nodeResults.get(source))
      .filter(result => result !== undefined);

    return sources.length > 0 ? sources[0] : {};
  }

  private async executeNode(node: any, execution: any, input: any, nodeResults: Map<string, any>): Promise<void> {
    const startTime = Date.now();
    
    // Create execution step
    const step = await this.prisma.executionStep.create({
      data: {
        executionId: execution.id,
        nodeId: node.id,
        nodeType: node.type,
        status: 'RUNNING',
        startedAt: new Date(),
        input,
      },
    });

    // Log step start
    await this.logStep(step.id, 'INFO', `Executing ${node.nodeType} node: ${node.name}`);

    try {
      let output;
      
      // Execute based on node type
      switch (node.nodeType) {
        case 'webhook':
          output = await this.executeWebhookNode(node, input);
          break;
        case 'http_request':
          output = await this.executeHttpRequestNode(node, input);
          break;
        case 'send_email':
          output = await this.executeEmailNode(node, input);
          break;
        case 'telegram_message':
          output = await this.executeTelegramNode(node, input);
          break;
        case 'data_transform':
          output = await this.executeDataTransformNode(node, input);
          break;
        default:
          throw new Error(`Unknown node type: ${node.nodeType}`);
      }

      const duration = Date.now() - startTime;

      // Update step with success
      await this.prisma.executionStep.update({
        where: { id: step.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          output,
        },
      });

      // Store result for next nodes
      nodeResults.set(node.id, output);

      // Log step completion
      await this.logStep(step.id, 'INFO', `Node completed successfully`, { duration });

    } catch (error) {
      const duration = Date.now() - startTime;

      // Update step with error
      await this.prisma.executionStep.update({
        where: { id: step.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: error.message,
          retryCount: { increment: 1 },
        },
      });

      // Log step error
      await this.logStep(step.id, 'ERROR', `Node execution failed: ${error.message}`);

      // Check if we should retry
      if (step.retryCount < step.maxRetries) {
        await this.logStep(step.id, 'INFO', `Scheduling retry attempt ${step.retryCount + 1}/${step.maxRetries}`);
        
        // Schedule retry job
        await this.workflowQueue.add('retry-workflow-step', {
          executionId: execution.id,
          stepId: step.id,
        }, {
          delay: Math.pow(2, step.retryCount) * 1000, // Exponential backoff
        });
      } else {
        throw error; // Max retries reached, fail the execution
      }
    }
  }

  private async executeWebhookNode(node: any, input: any): Promise<any> {
    // Webhook trigger node - just return the trigger data
    return input;
  }

  private async executeHttpRequestNode(node: any, input: any): Promise<any> {
    const config = node.config;
    
    try {
      const response = await this.httpService.request({
        url: config.url,
        method: config.method || 'POST',
        headers: config.headers || {},
        data: this.processTemplate(config.body || {}, input),
        timeout: config.timeout || 30000,
      }).toPromise();

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  private async executeEmailNode(node: any, input: any): Promise<any> {
    const config = node.config;
    
    try {
      // Call Action Service to send email
      const response = await this.httpService.post(
        `${process.env.ACTION_SERVICE_URL}/actions/send-email`,
        {
          to: config.to,
          subject: this.processTemplate(config.subject || '', input),
          body: this.processTemplate(config.body || '', input),
        }
      ).toPromise();

      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  private async executeTelegramNode(node: any, input: any): Promise<any> {
    const config = node.config;
    
    try {
      // Call Action Service to send Telegram message
      const response = await this.httpService.post(
        `${process.env.ACTION_SERVICE_URL}/actions/telegram-message`,
        {
          botToken: config.botToken,
          chatId: config.chatId,
          message: this.processTemplate(config.message || '', input),
        }
      ).toPromise();

      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      throw new Error(`Telegram message failed: ${error.message}`);
    }
  }

  private async executeDataTransformNode(node: any, input: any): Promise<any> {
    const config = node.config;
    
    try {
      // Simple data transformation - in real implementation, this would be more sophisticated
      const transformedData = this.processTemplate(config.transform || {}, input);
      
      return transformedData;
    } catch (error) {
      throw new Error(`Data transformation failed: ${error.message}`);
    }
  }

  private processTemplate(template: any, data: any): any {
    if (typeof template === 'string') {
      // Simple template processing with {{variable}} syntax
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    } else if (typeof template === 'object' && template !== null) {
      // Process object recursively
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.processTemplate(value, data);
      }
      return result;
    }
    
    return template;
  }

  private async logExecution(executionId: string, level: string, message: string, data?: any): Promise<void> {
    await this.prisma.executionLog.create({
      data: {
        executionId,
        level,
        message,
        data,
      },
    });
  }

  private async logStep(stepId: string, level: string, message: string, data?: any): Promise<void> {
    await this.prisma.executionLog.create({
      data: {
        stepId,
        level,
        message,
        data,
      },
    });
  }

  private async sendFailureNotification(execution: any, error: string): Promise<void> {
    try {
      // Call Notification Service
      await this.httpService.post(
        `${process.env.NOTIFICATION_SERVICE_URL}/notifications`,
        {
          type: 'workflow_failure',
          message: `Workflow execution failed: ${error}`,
          data: {
            executionId: execution.id,
            workflowId: execution.workflowId,
            error,
          },
        }
      ).toPromise();
    } catch (notificationError) {
      this.logger.error(`Failed to send failure notification: ${notificationError.message}`);
    }
  }

  async retryStep(executionId: string, stepId: string): Promise<any> {
    const step = await this.prisma.executionStep.findUnique({
      where: { id: stepId },
      include: { execution: true },
    });

    if (!step) {
      throw new Error('Step not found');
    }

    // Get workflow and node details
    const workflow = await this.getWorkflow(step.execution.workflowId);
    const node = workflow.nodes.find(n => n.id === step.nodeId);

    if (!node) {
      throw new Error('Node not found');
    }

    // Prepare input from previous step results
    const previousSteps = await this.prisma.executionStep.findMany({
      where: {
        executionId,
        status: 'COMPLETED',
        id: { not: stepId },
      },
      orderBy: { createdAt: 'asc' },
    });

    const input = previousSteps.length > 0 ? previousSteps[previousSteps.length - 1].output : {};

    // Execute the step again
    const nodeResults = new Map<string, any>();
    await this.executeNode(node, step.execution, input, nodeResults);

    return { success: true };
  }

  async triggerWorkflow(workflowId: string, triggerData?: any, userId?: string): Promise<string> {
    // Add job to queue
    const job = await this.workflowQueue.add('execute-workflow', {
      workflowId,
      triggerData,
      userId,
    });

    this.logger.log(`Workflow execution job queued: ${job.id}`);
    return job.id;
  }

  async getExecutionStatus(executionId: string): Promise<any> {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return execution;
  }
}
