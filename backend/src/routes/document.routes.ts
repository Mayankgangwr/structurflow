import { documentController } from "@/controllers/document.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { Router } from "express";

const documentRoutes = Router();

// ALL document routes require authentication
documentRoutes.use(requireAuth);

// Note: uploadMiddleware.single('file') handles parsing the multipart form data
documentRoutes.post('/', uploadMiddleware.single('file'), documentController.upload);

documentRoutes.get('/', documentController.list);
documentRoutes.get("/:id", documentController.getOne);

export default documentRoutes;