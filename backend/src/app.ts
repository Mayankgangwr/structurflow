import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { config } from "./config/env";
import { logger } from "./utils/logger";
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

// Trust reverse proxy (essential for Render / HTTPS / secure cookies / rate limiters)
app.set("trust proxy", 1);

// Security Middlewares
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: false,
    })
);

// Collect all allowed origins from environment variable (comma-separated or single)
const configuredOrigins = config.FRONTEND_URL
    ? config.FRONTEND_URL.split(",").flatMap((url) => {
        const trimmed = url.trim().replace(/\/$/, "");
        if (!trimmed) return [];
        if (/^https?:\/\//i.test(trimmed)) {
            return [trimmed];
        }
        // Automatically support both https and http if protocol was omitted (e.g. structurflow.prep10x.in)
        return [`https://${trimmed}`, `http://${trimmed}`];
    })
    : [];

// Determine whether incoming origin is permitted
const isAllowedOrigin = (origin?: string): boolean => {
    // Non-browser requests (Postman, curl, server-to-server)
    if (!origin) return true;

    // Localhost on any port (allows local dev testing against cloud backend)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return true;
    }

    // Render, Netlify, Vercel, and Prep10x domains (subdomains and custom domains)
    if (
        /^https:\/\/([a-zA-Z0-9-_]+\.)*onrender\.com$/.test(origin) ||
        /^https:\/\/([a-zA-Z0-9-_]+\.)*netlify\.app$/.test(origin) ||
        /^https:\/\/([a-zA-Z0-9-_]+\.)*vercel\.app$/.test(origin) ||
        /^https?:\/\/([a-zA-Z0-9-_]+\.)*prep10x\.in$/.test(origin)
    ) {
        return true;
    }

    // Configured FRONTEND_URL matches
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (configuredOrigins.some((allowed) => allowed === "*" || allowed === normalizedOrigin)) {
        return true;
    }

    return false;
};

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }
            logger.warn(`[CORS] Request origin not in whitelist: ${origin}`);
            return callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Organization-Id",
            "X-Request-Id",
            "Accept",
            "Origin",
            "Cookie",
        ],
        exposedHeaders: ["Set-Cookie"],
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
