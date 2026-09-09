import { Router } from "express";
import { projectController } from "@/controllers/project.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { Role } from "@/models/membership.model";

const projectRoutes = Router();

projectRoutes.use(requireAuth);

projectRoutes.post('/', requireRole(Role.OWNER, Role.ADMIN), projectController.create);
projectRoutes.get('/', requireRole(), projectController.list);
projectRoutes.get('/:id', requireRole(), projectController.getById);
projectRoutes.patch('/:id', requireRole(Role.OWNER, Role.ADMIN), projectController.updateById);
projectRoutes.delete('/:id', requireRole(Role.OWNER, Role.ADMIN), projectController.delete);

export default projectRoutes;
