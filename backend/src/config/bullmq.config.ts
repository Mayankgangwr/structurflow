import IORedis from 'ioredis';
import { config } from './env';

export const bullmqConnection = new IORedis({
    host: config.REDIS_HOST || 'localhost',
    port: parseInt(config.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required by BullMQ
});

bullmqConnection.on('connect', () => {
    console.log('BullMQ Redis connection established');
});

bullmqConnection.on('error', (err) => {
    console.error('BullMQ Redis connection error:', err);
});
