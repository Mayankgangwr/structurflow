import { createClient, type RedisClientType } from "redis";
import { config } from "./env";

class RedisService {
    public client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: config.REDIS_HOST && config.REDIS_PORT ?
                `redis://${config.REDIS_HOST}:${config.REDIS_PORT}` :
                "redis://localhost:6379",
        });

        this.client.on("error", (err) => {
            console.error("Redis Client Error:", err);
        });

        this.client.on("connect", () => {
            console.log("Redis Client Connected");
        });
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async disconnect() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }
}

export const redisClient = new RedisService();

export const redis = {
    async setJson(key: string, value: unknown, ttlMilliseconds: number) {
        await redisClient.connect();
        await redisClient.client.set(key, JSON.stringify(value), { EX: ttlMilliseconds });
    },

    async getJson<T>(key: string): Promise<T | null> {
        await redisClient.connect();
        const raw = await redisClient.client.get(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch (error) {
            console.error("Failed to parse redis JSON for key", key, error);
            return null;
        }
    },

    async del(key: string) {
        await redisClient.connect();
        await redisClient.client.del(key);
    }
};

