import { Request, Response } from "express";
import { runService } from "../services/runService";

export const runController = {
  async list(_req: Request, res: Response) {
    const runs = await runService.list();
    res.json({ items: runs });
  },

  async getById(req: Request, res: Response) {
    const run = await runService.getById(req.params.id);
    res.json(run);
  },
};

