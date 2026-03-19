import { Router, Request, Response } from "express";
import { triggerRoutes } from "./triggers";
import { workflowController } from "../controllers/workflowController";
import { runController } from "../controllers/runController";
import { authRoutes } from "./auth";
import {
  checkCreateWorkflowLimit,
  checkRunWorkflowLimit,
} from "../middleware/subscriptionMiddleware";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import { memberService } from "../services/memberService";
import { activityLogService } from "../services/activityLogService";
import { roleMiddleware } from "../middleware/roleMiddleware";
import { sseService } from "../services/sseService";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use(triggerRoutes);

// Workflows CRUD (protected)
routes.post("/workflows", authMiddleware, checkCreateWorkflowLimit, workflowController.create);
routes.get("/workflows", authMiddleware, workflowController.list);
routes.get("/workflows/:id", authMiddleware, workflowController.getById);
routes.put("/workflows/:id", authMiddleware, roleMiddleware("editor"), workflowController.update);
routes.delete("/workflows/:id", authMiddleware, roleMiddleware("owner"), workflowController.remove);

// Run workflow
routes.post(
  "/workflows/:id/run",
  authMiddleware,
  roleMiddleware("editor"),
  checkRunWorkflowLimit,
  workflowController.run
);

// Members (PART 5, 6, 7)
routes.get("/workflows/:id/members", authMiddleware, async (req: Request, res: Response) => {
  const data = await memberService.listMembers(req.params.id);
  res.json(data);
});

routes.post("/workflows/:id/invite", authMiddleware, roleMiddleware("owner"), async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const { email, role } = req.body ?? {};
  if (!email) return res.status(400).json({ message: "Email is required" });
  const invite = await memberService.inviteByEmail({
    workflowId: req.params.id,
    email,
    role: role || "viewer",
    inviterId: user.userId,
  });
  res.status(201).json(invite);
});

routes.post("/invite/:token/accept", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const member = await memberService.acceptInvite(req.params.token, user.userId);
  res.json(member);
});

routes.post("/workflows/:id/leave", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const result = await memberService.leaveWorkflow(req.params.id, user.userId);
  res.json(result);
});

routes.delete("/workflows/:id/members/:userId", authMiddleware, roleMiddleware("owner"), async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  await memberService.removeMember(req.params.id, req.params.userId, user.userId);
  res.status(204).send();
});

// Activity logs (PART 4)
routes.get("/workflows/:id/logs", authMiddleware, async (req: Request, res: Response) => {
  const logs = await activityLogService.listByWorkflow(req.params.id);
  res.json(logs);
});

// Runs (PART 8)
routes.get("/runs", authMiddleware, runController.list);
routes.get("/runs/:id", authMiddleware, runController.getById);

// SSE realtime logs (PART 10)
routes.get("/workflows/:id/events", authMiddleware, (req: Request, res: Response) => {
  sseService.addClient(req.params.id, res);
});

// User profile
routes.get("/users/me", authMiddleware, userController.me);
routes.patch("/users/me", authMiddleware, userController.updateMe);

