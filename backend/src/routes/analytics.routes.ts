import { Router } from "express";
import { analyticsController } from "@/controllers/analytics.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";

const analyticsRoutes = Router();

// All analytics routes require authentication & organization membership
analyticsRoutes.use(requireAuth);

analyticsRoutes.get("/dashboard", requireRole(), analyticsController.getDashboard);
analyticsRoutes.get("/overview", requireRole(), analyticsController.getOverview);
analyticsRoutes.get("/throughput", requireRole(), analyticsController.getThroughput);
analyticsRoutes.get("/projects", requireRole(), analyticsController.getProjects);
analyticsRoutes.get("/reviewers", requireRole(), analyticsController.getReviewers);

export default analyticsRoutes;
