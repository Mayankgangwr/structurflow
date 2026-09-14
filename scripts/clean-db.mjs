import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL is not set in your .env file.");
    process.exit(1);
}

const sql = neon(databaseUrl);

async function cleanDatabase() {
    console.log("🔄 Connecting to Neon PostgreSQL and deleting all Better-Auth data...\n");

    const tables = [
        "invitation",
        "member",
        "organization",
        "session",
        "account",
        "verification",
        "user",
    ];

    try {
        // Truncate all auth tables with CASCADE to reset all tables and references cleanly
        await sql`
            TRUNCATE TABLE 
                "invitation",
                "member",
                "organization",
                "session",
                "account",
                "verification",
                "user"
            CASCADE;
        `;

        console.log("✅ Successfully truncated the following tables:");
        for (const table of tables) {
            console.log(`   - "${table}" -> 0 rows`);
        }

        console.log("\n🎉 All Neon database and Better-Auth data has been completely cleared!");
    } catch (error) {
        console.error("❌ Failed to clean database:", error);
        process.exit(1);
    }
}

cleanDatabase();
