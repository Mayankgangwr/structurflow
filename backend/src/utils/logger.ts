import winston from "winston";
import { config } from "@/config/env";

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

export const logger = winston.createLogger({
    level: config.isDevelopment ? "debug" : "info",
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: config.isDevelopment
                ? winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, timestamp, stack }) => {
                        return `${timestamp} ${level} ${message} ${stack || ""}`;
                    })
                )
                : logFormat
        }),
    ],
});