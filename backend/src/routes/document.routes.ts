import { documentController } from "@/controllers/document.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { Router } from "express";

const documentRoutes = Router();

// ALL document routes require authentication
documentRoutes.use(requireAuth);

// Note: uploadMiddleware.single('file') handles parsing the multipart form data
documentRoutes.post('/', uploadMiddleware.array('files', 10), documentController.upload);

documentRoutes.get('/summary/:projectId', documentController.summary);
documentRoutes.get('/detail/:id', documentController.getOne);
documentRoutes.put('/:id/verify', documentController.verify);
documentRoutes.post('/:id/retry', documentController.retry);
documentRoutes.get('/:id/export', documentController.exportDocumentPdf);
documentRoutes.get('/:projectId', documentController.list);

export default documentRoutes;