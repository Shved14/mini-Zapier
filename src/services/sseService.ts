import { Response } from "express";

type SSEClient = {
  id: string;
  workflowId: string;
  res: Response;
};

const clients: SSEClient[] = [];

export const sseService = {
  addClient(workflowId: string, res: Response): string {
    const id = Math.random().toString(36).slice(2);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("data: {\"type\":\"connected\"}\n\n");

    clients.push({ id, workflowId, res });

    res.on("close", () => {
      const idx = clients.findIndex((c) => c.id === id);
      if (idx !== -1) clients.splice(idx, 1);
    });

    return id;
  },

  broadcast(workflowId: string, event: string, data: unknown) {
    const payload = JSON.stringify({ type: event, data });
    for (const client of clients) {
      if (client.workflowId === workflowId) {
        client.res.write(`data: ${payload}\n\n`);
      }
    }
  },
};
