import { IsString, IsOptional, IsJSON, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Node types
export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

// Trigger types
export enum TriggerType {
  WEBHOOK = 'webhook',
  CRON = 'cron',
  EMAIL = 'email',
  MANUAL = 'manual',
}

// Action types
export enum ActionType {
  HTTP_REQUEST = 'http_request',
  SEND_EMAIL = 'send_email',
  TELEGRAM_MESSAGE = 'telegram_message',
  DATABASE_QUERY = 'database_query',
  DATA_TRANSFORM = 'data_transform',
  WEBHOOK = 'webhook',
}

// Workflow Node DTO
export class WorkflowNodeDto {
  @ApiProperty({
    description: 'Node unique identifier',
    example: 'node_123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Node type',
    enum: NodeType,
    example: NodeType.TRIGGER,
  })
  @IsEnum(NodeType)
  type: NodeType;

  @ApiProperty({
    description: 'Node specific type',
    enum: [...Object.values(TriggerType), ...Object.values(ActionType)],
    example: TriggerType.WEBHOOK,
  })
  @IsString()
  @IsNotEmpty()
  nodeType: TriggerType | ActionType;

  @ApiProperty({
    description: 'Node display name',
    example: 'Webhook Trigger',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Node configuration',
    example: { url: '/webhook', method: 'POST' },
  })
  @IsJSON()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({
    description: 'Node position in canvas',
    example: { x: 100, y: 200 },
  })
  @IsJSON()
  position: Record<string, number>;
}

// Workflow Edge DTO
export class WorkflowEdgeDto {
  @ApiProperty({
    description: 'Edge unique identifier',
    example: 'edge_123',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Source node ID',
    example: 'node_123',
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: 'Target node ID',
    example: 'node_456',
  })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiPropertyOptional({
    description: 'Edge condition',
    example: { field: 'status', operator: 'equals', value: 'success' },
  })
  @IsOptional()
  @IsJSON()
  condition?: Record<string, any>;
}

// Trigger Configuration DTO
export class TriggerConfigDto {
  @ApiProperty({
    description: 'Trigger type',
    enum: TriggerType,
    example: TriggerType.WEBHOOK,
  })
  @IsEnum(TriggerType)
  type: TriggerType;

  @ApiProperty({
    description: 'Trigger configuration',
    example: { url: '/webhook', method: 'POST' },
  })
  @IsJSON()
  @IsNotEmpty()
  config: Record<string, any>;
}

// Create Workflow DTO
export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Workflow name',
    example: 'Process New Orders',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Process new orders from e-commerce platform',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'User ID who owns the workflow',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Workflow trigger configuration',
    type: TriggerConfigDto,
  })
  @ValidateNested()
  @Type(() => TriggerConfigDto)
  trigger: TriggerConfigDto;

  @ApiProperty({
    description: 'Workflow nodes',
    type: [WorkflowNodeDto],
  })
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @ApiPropertyOptional({
    description: 'Workflow edges (connections between nodes)',
    type: [WorkflowEdgeDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];

  @ApiPropertyOptional({
    description: 'Additional workflow settings',
    example: { timeout: 30000, retries: 3 },
  })
  @IsOptional()
  @IsJSON()
  settings?: Record<string, any>;
}

// Update Workflow DTO
export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: 'Workflow name',
    example: 'Updated Workflow Name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Workflow trigger configuration',
    type: TriggerConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerConfigDto)
  trigger?: TriggerConfigDto;

  @ApiPropertyOptional({
    description: 'Workflow nodes',
    type: [WorkflowNodeDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes?: WorkflowNodeDto[];

  @ApiPropertyOptional({
    description: 'Workflow edges',
    type: [WorkflowEdgeDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];

  @ApiPropertyOptional({
    description: 'Additional workflow settings',
    example: { timeout: 60000, retries: 5 },
  })
  @IsOptional()
  @IsJSON()
  settings?: Record<string, any>;
}

// Workflow Response DTO
export class WorkflowResponseDto {
  @ApiProperty({
    description: 'Workflow ID',
    example: 'workflow_123',
  })
  id: string;

  @ApiProperty({
    description: 'Workflow name',
    example: 'Process New Orders',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Process new orders from e-commerce platform',
  })
  description?: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  userId: string;

  @ApiProperty({
    description: 'Workflow status',
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Whether workflow is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Trigger configuration',
    example: { type: 'webhook', config: { url: '/webhook' } },
  })
  trigger: Record<string, any>;

  @ApiProperty({
    description: 'Workflow nodes',
    example: [{ id: 'node_1', type: 'trigger', nodeType: 'webhook', name: 'Webhook', config: {}, position: { x: 0, y: 0 } }],
  })
  nodes: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Workflow edges',
    example: [{ id: 'edge_1', source: 'node_1', target: 'node_2' }],
  })
  edges?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Workflow settings',
    example: { timeout: 30000 },
  })
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}
