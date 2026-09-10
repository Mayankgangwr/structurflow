import { Router } from "express";
import { sandboxController } from "@/controllers/sandbox.controller";
import { uploadMiddleware } from "@/middlewares/upload.middleware";
import { sandboxRateLimiter } from "@/middlewares/rate-limit.middleware";

const sandboxRoutes = Router();

// Public route: Get sample preset templates
sandboxRoutes.get("/presets", sandboxController.getPresets);

// Public route: Transform document without login (rate-limited, strictly ephemeral in-memory)
sandboxRoutes.post(
    "/transform",
    sandboxRateLimiter,
    uploadMiddleware.fields([
        { name: "document", maxCount: 1 },
        { name: "template", maxCount: 1 }
    ]),
    sandboxController.transform
);

export default sandboxRoutes;
