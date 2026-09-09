import { documentController } from "@/controllers/document.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { Role } from "@/models/membership.model";
import { Router } from "express";

const documentRoutes = Router();

// ALL document routes require authentication
documentRoutes.use(requireAuth);

// Document upload & processing (upload is restricted to OWNER, ADMIN; processing can be re-run during verification)
documentRoutes.post('/', requireRole(Role.OWNER, Role.ADMIN), uploadMiddleware.array('files', 10), documentController.upload);
documentRoutes.post('/process', requireRole(Role.OWNER, Role.ADMIN, Role.REVIEWER), documentController.process);

// Read & Export routes (accessible to any org member including VIEWER)
documentRoutes.get('/', requireRole(), documentController.listAll);
documentRoutes.get('/transform-preview/:id', requireRole(), documentController.transformedDocumentPreview);
documentRoutes.put('/export/:id', requireRole(), documentController.updateStatus);

documentRoutes.get('/summary/:projectId', requireRole(), documentController.summary);
documentRoutes.get('/detail/:id', requireRole(), documentController.getOne);
documentRoutes.get('/:projectId', requireRole(), documentController.list);

// Verification & Rejection (restricted to OWNER, ADMIN, REVIEWER)
documentRoutes.put('/verify/:id', requireRole(Role.OWNER, Role.ADMIN, Role.REVIEWER), documentController.verifyDocument);
documentRoutes.post('/bulk-verify', requireRole(Role.OWNER, Role.ADMIN, Role.REVIEWER), documentController.bulkVerify);
documentRoutes.put('/reject/:id', requireRole(Role.OWNER, Role.ADMIN, Role.REVIEWER), documentController.reject);

// Delete document (restricted to OWNER, ADMIN)
documentRoutes.delete('/:id', requireRole(Role.OWNER, Role.ADMIN), documentController.delete);

export default documentRoutes;