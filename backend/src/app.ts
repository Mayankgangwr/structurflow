import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { config } from "./config/env";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import teamRouter from "./routes/team.routes";
import projectRoutes from "./routes/project.routes";
import documentRoutes from "./routes/document.routes";
import templateRoutes from "./routes/template.routes";
import activityRoutes from "./routes/activity.routes";
import analyticsRoutes from "./routes/analytics.routes";
import sandboxRoutes from "./routes/sandbox.routes";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
    cors({
        origin: config.isDevelopment
            ? "http://localhost:3000"
            : (config.FRONTEND_URL || "https://www.structurflow.com"),
        credentials: true,
    })
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET));

// Request Tracking & Logging
app.use(requestIdMiddleware);
app.use(
    morgan(
        ":method :url :status :res[content-length] - :response-time ms - ID::req[X-Request-Id]"
    )
);

// Rate Limiting
app.use("/api", globalRateLimiter);

// Serve static uploads (for bypassing Cloudinary restrictions locally)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Setup Routes
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/invite", teamRouter);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/templates", templateRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/sandbox", sandboxRoutes);

// Fallback & Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
