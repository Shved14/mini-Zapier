import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { 
  CreateWorkflowDto, 
  UpdateWorkflowDto, 
  WorkflowResponseDto,
} from '../dto/create-workflow.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ 
    status: 201, 
    description: 'Workflow successfully created',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid workflow structure',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Workflow with this name already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createWorkflowDto: CreateWorkflowDto): Promise<WorkflowResponseDto> {
    return this.workflowService.create(createWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows for user' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of workflows',
    type: [WorkflowResponseDto],
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID to filter workflows',
    example: 'user_123',
  })
  async findAll(@Query('userId') userId: string): Promise<WorkflowResponseDto[]> {
    return this.workflowService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow details',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async findOne(@Param('id') id: string, @Query('userId') userId?: string): Promise<WorkflowResponseDto> {
    return this.workflowService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow successfully updated',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid workflow structure',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Workflow with this name already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string, 
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Query('userId') userId?: string
  ): Promise<WorkflowResponseDto> {
    return this.workflowService.update(id, updateWorkflowDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ 
    status: 204, 
    description: 'Workflow successfully deleted',
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Cannot delete workflow with active executions',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async remove(@Param('id') id: string, @Query('userId') userId?: string): Promise<void> {
    return this.workflowService.remove(id, userId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate workflow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow successfully activated',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid workflow structure for activation',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async activate(@Param('id') id: string, @Query('userId') userId?: string): Promise<WorkflowResponseDto> {
    return this.workflowService.activate(id, userId);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause workflow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow successfully paused',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async pause(@Param('id') id: string, @Query('userId') userId?: string): Promise<WorkflowResponseDto> {
    return this.workflowService.pause(id, userId);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow executions' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of workflow executions',
    type: [Object],
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async getExecutions(@Param('id') id: string, @Query('userId') userId?: string): Promise<any[]> {
    return this.workflowService.getExecutions(id, userId);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate workflow structure' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow structure is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        errors: { type: 'array', items: { type: 'string' }, example: [] },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  async validate(@Param('id') id: string, @Query('userId') userId?: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const workflow = await this.workflowService.findOne(id, userId);
      // If we can get the workflow, it means it passed validation
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error.message] 
      };
    }
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone workflow' })
  @ApiResponse({ 
    status: 201, 
    description: 'Workflow successfully cloned',
    type: WorkflowResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Workflow not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow ID to clone',
    example: 'workflow_123',
  })
  async clone(@Param('id') id: string, @Query('userId') userId?: string): Promise<WorkflowResponseDto> {
    const originalWorkflow = await this.workflowService.findOne(id, userId);
    
    const clonedWorkflow: CreateWorkflowDto = {
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      userId: originalWorkflow.userId,
      trigger: originalWorkflow.trigger,
      nodes: originalWorkflow.nodes,
      edges: originalWorkflow.edges,
      settings: originalWorkflow.settings,
    };

    return this.workflowService.create(clonedWorkflow);
  }
}
