import { Request, Response } from "express";
import { runService } from "../services/runService";

export const runController = {
  async list(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    const runs = await runService.list(user?.userId);
    res.json({ items: runs });
  },

  async getById(req: Request, res: Response) {
    const run = await runService.getById(req.params.id);
    res.json(run);
  },
};

