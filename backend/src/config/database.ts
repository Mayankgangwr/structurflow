import mongoose from "mongoose";
import { config } from "./env";
import { logger } from "@/utils/logger";

export const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(config.MONGO_URI);
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};