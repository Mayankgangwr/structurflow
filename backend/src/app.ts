import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { config } from "./config/env";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { success } from "zod";
import authRoutes from "./routes/auth.routes";
import teamRouter from "./routes/team.routes";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: config.isDevelopment ?
        'http://localhost:3000' :
        "https//www.structurflow.com",
    credentials: true,
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET));

// Request Tracking & Logging
app.use(requestIdMiddleware);
app.use(morgan(':method :url :status :res[content-lenght] - :response-time ms - ID::req[X-Request-Id]'));

// Rate Limiting
app.use('/api', globalRateLimiter);

// Setup Routes (Placeholder for now)
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, })
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invite', teamRouter)

// Fallback & Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;

