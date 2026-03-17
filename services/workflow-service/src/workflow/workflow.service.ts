import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowResponseDto,
  NodeType,
  TriggerType,
  ActionType,
} from '../dto/create-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) { }

  async create(createWorkflowDto: CreateWorkflowDto): Promise<WorkflowResponseDto> {
    // Validate workflow structure
    this.validateWorkflowStructure(createWorkflowDto);

    // Check if user has workflow with same name
    const existingWorkflow = await this.prisma.workflow.findFirst({
      where: {
        userId: createWorkflowDto.userId,
        name: createWorkflowDto.name,
      },
    });

    if (existingWorkflow) {
      throw new ConflictException('Workflow with this name already exists');
    }

    const workflow = await this.prisma.workflow.create({
      data: {
        name: createWorkflowDto.name,
        description: createWorkflowDto.description,
        userId: createWorkflowDto.userId,
        trigger: createWorkflowDto.trigger,
        nodes: createWorkflowDto.nodes,
        edges: createWorkflowDto.edges || [],
        settings: createWorkflowDto.settings,
        status: 'DRAFT',
        isActive: false,
      },
    });

    return this.mapToResponseDto(workflow);
  }

  async findAll(userId: string): Promise<WorkflowResponseDto[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return workflows.map(workflow => this.mapToResponseDto(workflow));
  }

  async findOne(id: string, userId?: string): Promise<WorkflowResponseDto> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && workflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    return this.mapToResponseDto(workflow);
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto, userId?: string): Promise<WorkflowResponseDto> {
    // Check if workflow exists
    const existingWorkflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!existingWorkflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && existingWorkflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate workflow structure if nodes/edges are being updated
    if (updateWorkflowDto.nodes || updateWorkflowDto.edges) {
      const tempWorkflow = {
        ...existingWorkflow,
        ...updateWorkflowDto,
      } as any;
      this.validateWorkflowStructure(tempWorkflow);
    }

    // Check for name conflicts
    if (updateWorkflowDto.name && updateWorkflowDto.name !== existingWorkflow.name) {
      const nameConflict = await this.prisma.workflow.findFirst({
        where: {
          userId: existingWorkflow.userId,
          name: updateWorkflowDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Workflow with this name already exists');
      }
    }

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...updateWorkflowDto,
        updatedAt: new Date(),
      },
    });

    return this.mapToResponseDto(workflow);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && workflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    // Check if workflow has active executions
    const activeExecutions = await this.prisma.workflowExecution.count({
      where: {
        workflowId: id,
        status: {
          in: ['PENDING', 'RUNNING'],
        },
      },
    });

    if (activeExecutions > 0) {
      throw new BadRequestException('Cannot delete workflow with active executions');
    }

    await this.prisma.workflow.delete({
      where: { id },
    });
  }

  async activate(id: string, userId?: string): Promise<WorkflowResponseDto> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && workflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate workflow before activation
    this.validateWorkflowStructure(workflow as any);

    const updatedWorkflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return this.mapToResponseDto(updatedWorkflow);
  }

  async pause(id: string, userId?: string): Promise<WorkflowResponseDto> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && workflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    const updatedWorkflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: 'PAUSED',
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return this.mapToResponseDto(updatedWorkflow);
  }

  async getExecutions(id: string, userId?: string): Promise<any[]> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (userId && workflow.userId !== userId) {
      throw new NotFoundException('Workflow not found');
    }

    const executions = await this.prisma.workflowExecution.findMany({
      where: { workflowId: id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return executions;
  }

  private validateWorkflowStructure(workflow: any): void {
    const { trigger, nodes, edges } = workflow;

    // Validate trigger
    if (!trigger || !trigger.type || !trigger.config) {
      throw new BadRequestException('Workflow must have a valid trigger');
    }

    if (!Object.values(TriggerType).includes(trigger.type)) {
      throw new BadRequestException('Invalid trigger type');
    }

    // Validate nodes
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one node');
    }

    // Check for exactly one trigger node
    const triggerNodes = nodes.filter(node => node.type === NodeType.TRIGGER);
    if (triggerNodes.length !== 1) {
      throw new BadRequestException('Workflow must have exactly one trigger node');
    }

    // Validate each node
    const nodeIds = new Set<string>();
    for (const node of nodes) {
      if (!node.id || !node.type || !node.nodeType || !node.name || !node.config) {
        throw new BadRequestException('Invalid node structure');
      }

      if (nodeIds.has(node.id)) {
        throw new BadRequestException(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);

      // Validate node type
      if (node.type === NodeType.TRIGGER) {
        if (!Object.values(TriggerType).includes(node.nodeType)) {
          throw new BadRequestException(`Invalid trigger node type: ${node.nodeType}`);
        }
      } else if (node.type === NodeType.ACTION) {
        if (!Object.values(ActionType).includes(node.nodeType)) {
          throw new BadRequestException(`Invalid action node type: ${node.nodeType}`);
        }
      } else {
        throw new BadRequestException(`Invalid node type: ${node.type}`);
      }

      // Validate position
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        throw new BadRequestException('Node must have valid position');
      }
    }

    // Validate edges
    if (edges && Array.isArray(edges)) {
      for (const edge of edges) {
        if (!edge.id || !edge.source || !edge.target) {
          throw new BadRequestException('Invalid edge structure');
        }

        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
          throw new BadRequestException('Edge references non-existent node');
        }

        // Prevent cycles (simple check)
        if (edge.source === edge.target) {
          throw new BadRequestException('Edge cannot connect node to itself');
        }
      }
    }

    // Validate workflow connectivity (all action nodes should be reachable from trigger)
    if (edges && edges.length > 0) {
      const triggerNodeId = triggerNodes[0].id;
      const reachableNodes = this.getReachableNodes(triggerNodeId, edges, nodeIds);

      const actionNodes = nodes.filter(node => node.type === NodeType.ACTION);
      for (const actionNode of actionNodes) {
        if (!reachableNodes.has(actionNode.id)) {
          throw new BadRequestException(`Action node "${actionNode.name}" is not reachable from trigger`);
        }
      }
    }
  }

  private getReachableNodes(startNodeId: string, edges: any[], allNodeIds: Set<string>): Set<string> {
    const reachable = new Set<string>([startNodeId]);
    const toVisit = [startNodeId];
    const edgeMap = new Map<string, string[]>();

    // Build adjacency map
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // BFS traversal
    while (toVisit.length > 0) {
      const current = toVisit.shift()!;
      const neighbors = edgeMap.get(current) || [];

      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          toVisit.push(neighbor);
        }
      }
    }

    return reachable;
  }

  private mapToResponseDto(workflow: any): WorkflowResponseDto {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      userId: workflow.userId,
      status: workflow.status,
      isActive: workflow.isActive,
      trigger: workflow.trigger,
      nodes: workflow.nodes,
      edges: workflow.edges,
      settings: workflow.settings,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    };
  }
}
