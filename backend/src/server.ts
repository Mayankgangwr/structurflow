
import app from "./app";
import { config } from "./config/env";
import { connectDatabase } from "./config/database";
import { logger } from "./utils/logger";

// Start the BullMQ document processing worker
import './workers/document.worker';

const startServer = async () => {
    try {
        // connect to DB
        await connectDatabase();

        const server = app.listen(config.port, ()=>{
            logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.port}`);
        });

        // Gracefull Shutdown
        const shutdown = () => {
            logger.info('🛑 Shutting down server gracefully...');
            server.close(()=>{
                logger.info('Server closed.');
                process.exit(1);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    };
}

startServer();