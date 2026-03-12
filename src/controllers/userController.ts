import { Request, Response } from "express";
import { userService } from "../services/userService";

export const userController = {
  async me(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const me = await userService.getMe(user.userId);
    res.json(me);
  },

  async updateMe(req: Request, res: Response) {
    const user = (req as any).user as { userId?: string } | undefined;
    if (!user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name } = req.body ?? {};
    const updated = await userService.updateMe(user.userId, { name });
    res.json(updated);
  },
};

