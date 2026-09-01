import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import type { SignOptions } from "jsonwebtoken";

// load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default('5000'),

    FRONTEND_URL: z.string().url().default("http://localhost:3000"),

    MONGO_URI: z.string().url(),

    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string().default("6379"),

    JWT_ACCESS_SECRET: z.string().min(10),
    JWT_ACCESS_EXPIRES_IN: z.string().default('1h'),

    JWT_REFRESH_SECRET: z.string().min(10),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    COOKIE_SECRET: z.string().min(10),

    LOG_LEVEL: z.string().default('info'),

    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_SECURE: z.string().transform((val) => val.toLowerCase() === 'true').or(z.boolean()).default(false),
    SMTP_USER: z.string().default("iammayankgangwarbly@gmail.com"),
    SMTP_PASS: z.string().default("dnfgogbbjnhndnmv"),
    SMTP_FROM: z.string().default("iammayankgangwarbly@gmail.com"),

    OTP_TTL_MINUTES: z.coerce.number().default(15),
    PENDING_SIGNUP_TTL_MINUTES: z.coerce.number().default(120),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),

    SUPABASE_URL: z.string(),
    SUPABASE_PUBLISHABLE_KEY: z.string(),
    SUPABASE_SECRET_KEY: z.string(),

    GEMINI_API_KEY: z.string()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("", _env.error.format());
    process.exit(1);
}

export const config = {
    ..._env.data,
    JWT_ACCESS_EXPIRES_IN: _env.data.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    JWT_REFRESH_EXPIRES_IN: _env.data.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    isDevelopment: _env.data.NODE_ENV === 'development',
    isProduction: _env.data.NODE_ENV === "production",
    port: parseInt(_env.data.PORT, 10),
}
