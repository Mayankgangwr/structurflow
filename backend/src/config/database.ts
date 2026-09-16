import mongoose from "mongoose";
import { Resolver } from "node:dns/promises";
import { config } from "./env";
import { logger } from "@/utils/logger";

async function resolveSrvUriIfNeeded(uri: string): Promise<string> {
    if (!uri.startsWith("mongodb+srv://")) {
        return uri;
    }

    try {
        const urlMatch = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
        if (!urlMatch) return uri;

        const [, user, pass, host, path = "/structurflow"] = urlMatch;
        const resolver = new Resolver();
        resolver.setServers(["8.8.8.8", "1.1.1.1"]);

        const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
        if (!srvRecords || srvRecords.length === 0) return uri;

        let replicaSet = "atlas-fnm224-shard-0";
        try {
            const txtRecords = await resolver.resolveTxt(host);
            for (const txt of txtRecords.flat()) {
                const match = txt.match(/replicaSet=([^&]+)/);
                if (match) replicaSet = match[1];
            }
        } catch {
            // fallback default replicaSet
        }

        const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
        const cleanPath = !path || path === "/" ? "/structurflow" : path;
        return `mongodb://${user}:${pass}@${hosts}${cleanPath}?ssl=true&replicaSet=${replicaSet}&authSource=admin&retryWrites=true&w=majority`;
    } catch {
        return uri;
    }
}

export const connectDatabase = async () => {
    try {
        let uri = config.MONGO_URI;
        try {
            const conn = await mongoose.connect(uri, { dbName: "structurflow" });
            logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (initialErr: any) {
            if (initialErr?.message?.includes("querySrv") || initialErr?.code === "ECONNREFUSED") {
                logger.warn("⚠️ System DNS refused SRV lookup. Resolving via public DNS fallback...");
                uri = await resolveSrvUriIfNeeded(uri);
                const conn = await mongoose.connect(uri, { dbName: "structurflow" });
                logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
                return;
            }
            throw initialErr;
        }
    } catch (error) {
        logger.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};