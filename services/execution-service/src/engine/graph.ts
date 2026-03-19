import { WorkflowNode, WorkflowEdge } from "../queue/workflow.queue";

export interface ExecutionGraph {
  nodes: Map<string, WorkflowNode>;
  adjacency: Map<string, string[]>;
  sorted: string[];
}

export function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): ExecutionGraph {
  const nodeMap = new Map<string, WorkflowNode>();
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error("Workflow graph contains a cycle — cannot determine execution order");
  }

  return { nodes: nodeMap, adjacency, sorted };
}
