import { templateController } from "@/controllers/template.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { Role } from "@/models/membership.model";
import { Router } from "express";

const templateRoutes = Router();

// ALL template routes require authentication
templateRoutes.use(requireAuth);

// Note: uploadMiddleware.single('file') handles parsing the multipart form data
templateRoutes.post('/', requireRole(Role.OWNER, Role.ADMIN), uploadMiddleware.single('file'), templateController.upload);

// Process the template
templateRoutes.put('/proccess', requireRole(Role.OWNER, Role.ADMIN), templateController.proccess);

export default templateRoutes;
