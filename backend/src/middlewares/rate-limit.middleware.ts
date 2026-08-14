import rateLimit from "express-rate-limit";
import { ApiResponse } from "@/types/api.types";
import { fail } from "@/utils/response";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth request per windowMs
    handler: (req, res) => {
        fail(res, 429, "Too Many requests", [
            {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many authentication attempts. Please try again later.'
            }
        ])
    },
    standardHeaders: true,
    legacyHeaders: false
})

export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'To many requests from the IP, please try again later',
        }
    } as ApiResponse,
    standardHeaders: true,
    legacyHeaders: false
});