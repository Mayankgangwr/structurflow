import { Router } from "express";
import { projectController } from "@/controllers/project.controller";
import { requireAuth } from "@/middlewares/auth.middleware";

const projectRoutes = Router();

projectRoutes.use(requireAuth);

projectRoutes.post('/', projectController.create);
projectRoutes.get('/', projectController.list);
projectRoutes.get('/:id', projectController.getById);
projectRoutes.patch('/:id', projectController.updateById);
projectRoutes.delete('/:id', projectController.delete);

export default projectRoutes;
