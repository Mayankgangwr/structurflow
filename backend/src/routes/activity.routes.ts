import { Router } from "express";
import { activityController } from "@/controllers/activity.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";

const activityRoutes = Router();

// All activity routes require authentication & organization membership
activityRoutes.use(requireAuth);

activityRoutes.get("/stats", requireRole(), activityController.stats);
activityRoutes.get("/", requireRole(), activityController.list);

export default activityRoutes;
