import { prisma } from "../utils/prisma";

// Function to get user info from JWT token metadata
async function getUserInfo(userId: string): Promise<{ email: string; name?: string } | null> {
  // For now, return a simple placeholder. In a real implementation,
  // you might cache user info or use a different approach
  return {
    email: `user-${userId.slice(0, 8)}@example.com`,
    name: `User ${userId.slice(0, 8)}`
  };
}

export interface ActivityMetadata {
  workflowName?: string;
  nodeName?: string;
  nodeType?: string;
  fromNode?: string;
  toNode?: string;
  config?: Record<string, unknown>;
  previousName?: string;
  newName?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface ActivityLogWithUser {
  id: string;
  workflowId: string;
  userId: string;
  action: string;
  metadata: ActivityMetadata | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export async function logActivity(
  workflowId: string,
  userId: string,
  action: string,
  metadata?: ActivityMetadata
) {
  return prisma.activityLog.create({
    data: {
      workflowId,
      userId,
      action,
      metadata: metadata as any ?? undefined
    },
  });
}

export async function getActivityLogs(workflowId: string, limit: number = 50) {
  const logs = await prisma.activityLog.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Add generated messages to each log with user info
  const logsWithMessages = await Promise.all(
    logs.map(async (log) => {
      const userInfo = await getUserInfo(log.userId);
      const userName = userInfo?.name || userInfo?.email || 'Unknown User';
      const message = getActivityMessage(log, userName);
      console.log('Generated message for log:', { logId: log.id, message });
      return {
        ...log,
        message: message,
        user: userInfo
      };
    })
  );

  console.log('Final logs with messages:', logsWithMessages.map(l => ({ id: l.id, message: l.message })));
  return logsWithMessages;
}

export function getActivityMessage(log: any, userName?: string): string {
  const userDisplayName = userName || 'A user';
  const { metadata } = log;

  console.log('getActivityMessage called with:', { action: log.action, metadata, userName });

  switch (log.action) {
    case 'node_added':
      const addedNodeType = metadata?.nodeType || 'node';
      const addedNodeId = metadata?.nodeId || 'unknown';
      const message = `${userDisplayName} added ${addedNodeType} (${addedNodeId})`;
      console.log('node_added case message:', message);
      return message;
    case 'workflow_created':
      return `${userDisplayName} created workflow "${metadata?.name || metadata?.workflowName || 'Unknown'}"`;

    case 'workflow_renamed':
      return `${userDisplayName} renamed workflow from "${metadata?.previousName}" to "${metadata?.newName}"`;

    case 'workflow_deleted':
      return `${userDisplayName} deleted workflow "${metadata?.workflowName || 'Unknown'}"`;

    case 'workflow_updated':
      return `${userDisplayName} updated workflow structure`;

    case 'node_added':
      const nodeType = metadata?.nodeType || 'node';
      const nodeId = metadata?.nodeId || 'unknown';
      return `${userDisplayName} added ${nodeType} (${nodeId})`;

    case 'node_deleted':
      const delNodeType = metadata?.nodeType || 'node';
      const delNodeId = metadata?.nodeId || 'unknown';
      return `${userDisplayName} deleted ${delNodeType} (${delNodeId})`;

    case 'node_updated':
      const updNodeType = metadata?.nodeType || 'node';
      const updNodeId = metadata?.nodeId || 'unknown';
      return `${userDisplayName} updated ${updNodeType} (${updNodeId})`;

    case 'node_config_updated':
      const cfgNodeType = metadata?.nodeType || 'node';
      const cfgNodeId = metadata?.nodeId || 'unknown';
      const configField = metadata?.configField || 'configuration';
      return `${userDisplayName} changed ${configField} of ${cfgNodeType} (${cfgNodeId})`;

    case 'nodes_connected':
      return `${userDisplayName} connected "${metadata?.fromNode}" → "${metadata?.toNode}"`;

    case 'nodes_disconnected':
      return `${userDisplayName} disconnected "${metadata?.fromNode}" → "${metadata?.toNode}"`;

    case 'workflow_run_started':
      return `${userDisplayName} started workflow execution`;

    case 'workflow_run_completed':
      return `${userDisplayName} completed workflow execution`;

    case 'workflow_run_failed':
      return `${userDisplayName}'s workflow execution failed`;

    case 'member_invited':
      return `${userDisplayName} invited ${metadata?.email} as ${metadata?.role}`;

    case 'edge_added':
      const edgeSource = log.metadata?.source || 'unknown';
      const edgeTarget = log.metadata?.target || 'unknown';
      return `${userDisplayName} connected ${edgeSource} to ${edgeTarget}`;

    case 'edge_deleted':
      const delSource = log.metadata?.source || 'unknown';
      const delTarget = log.metadata?.target || 'unknown';
      return `${userDisplayName} disconnected ${delSource} from ${delTarget}`;

    case 'status_changed':
      return `${userDisplayName} changed status to "${metadata?.status}"`;

    case 'settings_updated':
      return `${userDisplayName} updated workflow settings`;

    default:
      return `${userDisplayName} performed action: ${log.action}`;
  }
}

// Action constants for type safety
export const ACTIVITY_ACTIONS = {
  WORKFLOW_CREATED: "workflow_created",
  WORKFLOW_UPDATED: "workflow_updated",
  WORKFLOW_DELETED: "workflow_deleted",
  WORKFLOW_RENAMED: "workflow_renamed",
  WORKFLOW_RUN: "workflow_run",
  NODE_ADDED: "node_added",
  NODE_DELETED: "node_deleted",
  NODE_UPDATED: "node_updated",
  NODE_CONFIG_UPDATED: "node_config_updated",
  EDGE_ADDED: "edge_added",
  EDGE_DELETED: "edge_deleted",
  STATUS_CHANGED: "status_changed",
  SETTINGS_UPDATED: "settings_updated",
  WORKFLOW_RUN_COMPLETED: 'workflow_run_completed',
  WORKFLOW_RUN_FAILED: 'workflow_run_failed',
  MEMBER_INVITED: 'member_invited',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
} as const;
