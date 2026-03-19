export type ValidationError = {
  field: string;
  message: string;
};

export function validateWorkflowJson(json: unknown): {
  valid: boolean;
  errors: ValidationError[];
  sanitized?: { nodes: any[]; edges: any[] };
} {
  const errors: ValidationError[] = [];

  if (!json || typeof json !== "object") {
    return { valid: false, errors: [{ field: "workflowJson", message: "Must be an object" }] };
  }

  const obj = json as Record<string, unknown>;

  // Validate nodes
  if (!Array.isArray(obj.nodes)) {
    errors.push({ field: "nodes", message: "Must be an array" });
  } else {
    const nodeIds = new Set<string>();
    for (let i = 0; i < obj.nodes.length; i++) {
      const node = obj.nodes[i];
      if (!node || typeof node !== "object") {
        errors.push({ field: `nodes[${i}]`, message: "Must be an object" });
        continue;
      }
      const n = node as Record<string, unknown>;
      if (!n.id || typeof n.id !== "string") {
        errors.push({ field: `nodes[${i}].id`, message: "Must be a non-empty string" });
      } else {
        nodeIds.add(n.id);
      }
      if (!n.type || typeof n.type !== "string") {
        errors.push({ field: `nodes[${i}].type`, message: "Must be a non-empty string" });
      }
      // Ensure config defaults to {}
      if (n.config === undefined || n.config === null) {
        (node as any).config = {};
      }
    }

    // Validate edges
    if (!Array.isArray(obj.edges)) {
      errors.push({ field: "edges", message: "Must be an array" });
    } else {
      for (let i = 0; i < obj.edges.length; i++) {
        const edge = obj.edges[i];
        if (!edge || typeof edge !== "object") {
          errors.push({ field: `edges[${i}]`, message: "Must be an object" });
          continue;
        }
        const e = edge as Record<string, unknown>;
        if (!e.from || typeof e.from !== "string") {
          errors.push({ field: `edges[${i}].from`, message: "Must be a non-empty string" });
        } else if (!nodeIds.has(e.from)) {
          errors.push({ field: `edges[${i}].from`, message: `References non-existent node "${e.from}"` });
        }
        if (!e.to || typeof e.to !== "string") {
          errors.push({ field: `edges[${i}].to`, message: "Must be a non-empty string" });
        } else if (!nodeIds.has(e.to)) {
          errors.push({ field: `edges[${i}].to`, message: `References non-existent node "${e.to}"` });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitizedNodes = (obj.nodes as any[]).map((n: any) => ({
    id: n.id,
    type: n.type,
    config: n.config ?? {},
  }));

  const sanitizedEdges = (obj.edges as any[]).map((e: any) => ({
    from: e.from,
    to: e.to,
  }));

  return { valid: true, errors: [], sanitized: { nodes: sanitizedNodes, edges: sanitizedEdges } };
}
