import { templateController } from "@/controllers/template.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { Router } from "express";

const templateRoutes = Router();

// ALL template routes require authentication
templateRoutes.use(requireAuth);

// Note: uploadMiddleware.single('file') handles parsing the multipart form data
templateRoutes.post('/', uploadMiddleware.single('file'), templateController.upload);

// Proccess the template
templateRoutes.put('/proccess', templateController.proccess);
// templateRoutes.get('/project/:projectId', templateController.listByProject);
// templateRoutes.get('/', templateController.listByOrg);
// templateRoutes.get('/project/:projectId/active', templateController.getActiveByProject);
// templateRoutes.get('/:id', templateController.getOne);

// templateRoutes.put('/:id/active', templateController.setActive);
// templateRoutes.delete('/:id', templateController.delete);

export default templateRoutes;
