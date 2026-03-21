export async function logActivityToWorkflowService(
  workflowId: string,
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  try {
    const url = `${process.env.WORKFLOW_SERVICE_URL || "http://workflow-service:3002"}/workflows/${workflowId}/activity`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, metadata }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
