import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDatabase } from "@/config/database";
import { DocumentModel } from "@/models/document.model";
import { TemplateModel } from "@/models/template.model";
import { ProjectModel } from "@/models/project.model";
import { supabaseAdmin } from "@/config/supabase";

interface ScriptOptions {
    dryRun: boolean;
    permanent: boolean;
    skipStorage: boolean;
}

function parseArguments(): ScriptOptions {
    const args = process.argv.slice(2);
    const options: ScriptOptions = {
        dryRun: false,
        permanent: false,
        skipStorage: false,
    };

    for (const arg of args) {
        if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg === "--permanent" || arg === "--hard") {
            options.permanent = true;
        } else if (arg === "--skip-storage") {
            options.skipStorage = true;
        } else if (arg === "--help" || arg === "-h") {
            console.log(`
Usage: npx tsx src/scripts/clean-deleted-projects-data.ts [options]

Options:
  --dry-run       Preview what will be deleted without making changes
  --permanent     Hard delete records from MongoDB (default is soft delete)
  --skip-storage  Skip deleting files from Supabase Storage
  -h, --help      Show this help message
`);
            process.exit(0);
        }
    }

    return options;
}

async function removeStorageFiles(filePaths: string[]): Promise<{ deleted: number; errors: number }> {
    const BUCKET_NAME = "StructurFlow";
    let deleted = 0;
    let errors = 0;

    const validPaths = filePaths.filter((p) => typeof p === "string" && p.trim().length > 0);
    if (validPaths.length === 0) {
        return { deleted: 0, errors: 0 };
    }

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < validPaths.length; i += batchSize) {
        const batch = validPaths.slice(i, i + batchSize);
        try {
            const { data, error } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove(batch);

            if (error) {
                console.warn(`⚠️  Supabase storage deletion batch error:`, error.message);
                errors += batch.length;
            } else {
                deleted += data?.length ?? batch.length;
            }
        } catch (err: any) {
            console.warn(`⚠️  Failed to delete batch from Supabase storage:`, err?.message || err);
            errors += batch.length;
        }
    }

    return { deleted, errors };
}

async function run() {
    const options = parseArguments();

    console.log("===============================================================");
    console.log("🧹 Clean Documents & Templates of Deleted Projects");
    console.log("===============================================================");
    if (options.dryRun) {
        console.log("🔍 MODE: DRY-RUN (Preview only, no data will be modified)");
    } else {
        console.log(`⚡ MODE: ${options.permanent ? "PERMANENT HARD DELETE" : "SOFT DELETE (isDeleted: true)"}`);
    }
    if (options.skipStorage) {
        console.log("📦 Supabase Storage: SKIPPED");
    }
    console.log("---------------------------------------------------------------");

    await connectDatabase();

    try {
        // 1. Fetch all projects that are deleted or find all active projects
        const deletedProjects = await ProjectModel.find({ isDeleted: true })
            .select("_id name organizationId createdAt")
            .lean();

        const activeProjects = await ProjectModel.find({ isDeleted: { $ne: true } })
            .select("_id")
            .lean();

        const deletedProjectIds = deletedProjects.map((p) => p._id);
        const activeProjectIds = activeProjects.map((p) => p._id);

        console.log(`📌 Found ${deletedProjects.length} deleted project(s) in database:`);
        for (const p of deletedProjects) {
            console.log(`   • [${p._id}] "${p.name}"`);
        }

        // 2. Query documents & templates that belong to deleted projects OR orphaned projects
        const targetFilter = {
            $or: [
                { projectId: { $in: deletedProjectIds } },
                { projectId: { $nin: activeProjectIds } },
            ],
        };

        const documents = await DocumentModel.find(targetFilter)
            .select("_id originalFileName publicId projectId isDeleted")
            .lean();

        const templates = await TemplateModel.find(targetFilter)
            .select("_id originalFileName publicId projectId isDeleted isActive")
            .lean();

        console.log(`\n📄 Found ${documents.length} document(s) linked to deleted/missing projects.`);
        console.log(`📑 Found ${templates.length} template(s) linked to deleted/missing projects.`);

        const docsNeedingAction = options.permanent
            ? documents
            : documents.filter((d) => !d.isDeleted);

        const templatesNeedingAction = options.permanent
            ? templates
            : templates.filter((t) => !t.isDeleted || t.isActive);

        console.log(`   - Documents to be processed: ${docsNeedingAction.length}`);
        console.log(`   - Templates to be processed: ${templatesNeedingAction.length}`);

        const storagePathsToDelete: string[] = [
            ...documents.map((d) => d.publicId).filter(Boolean),
            ...templates.map((t) => t.publicId).filter(Boolean),
        ];

        console.log(`📦 Found ${storagePathsToDelete.length} storage file reference(s) to purge.`);

        if (options.dryRun) {
            console.log("\n[DRY-RUN Complete] No records were modified.");
            return;
        }

        if (documents.length === 0 && templates.length === 0) {
            console.log("\n✨ No orphaned documents or templates found. Everything is clean!");
            return;
        }

        // 3. Delete files from Supabase Storage
        let storageStats = { deleted: 0, errors: 0 };
        if (!options.skipStorage && storagePathsToDelete.length > 0) {
            console.log("\n🗑️  Purging files from Supabase Storage...");
            storageStats = await removeStorageFiles(storagePathsToDelete);
            console.log(`   ✅ Storage removal finished: ${storageStats.deleted} deleted, ${storageStats.errors} errors.`);
        }

        // 4. Update or Delete Document records
        if (options.permanent) {
            console.log("\n🗑️  Permanently deleting documents from MongoDB...");
            const docResult = await DocumentModel.deleteMany(targetFilter);
            console.log(`   ✅ Permanently deleted ${docResult.deletedCount} document record(s).`);

            console.log("\n🗑️  Permanently deleting templates from MongoDB...");
            const tmplResult = await TemplateModel.deleteMany(targetFilter);
            console.log(`   ✅ Permanently deleted ${tmplResult.deletedCount} template record(s).`);
        } else {
            console.log("\n🔄 Soft-deleting documents (isDeleted: true)...");
            const docResult = await DocumentModel.updateMany(targetFilter, {
                $set: { isDeleted: true },
            });
            console.log(`   ✅ Marked ${docResult.modifiedCount} document(s) as deleted.`);

            console.log("\n🔄 Soft-deleting templates (isDeleted: true, isActive: false)...");
            const tmplResult = await TemplateModel.updateMany(targetFilter, {
                $set: { isDeleted: true, isActive: false },
            });
            console.log(`   ✅ Marked ${tmplResult.modifiedCount} template(s) as deleted & inactive.`);
        }

        console.log("\n===============================================================");
        console.log("✨ Cleanup Completed Successfully!");
        console.log("===============================================================");
        console.log(`- Deleted Projects Checked: ${deletedProjects.length}`);
        console.log(`- Documents Cleaned:        ${documents.length}`);
        console.log(`- Templates Cleaned:        ${templates.length}`);
        if (!options.skipStorage) {
            console.log(`- Storage Files Removed:    ${storageStats.deleted}`);
        }
        console.log("===============================================================");
    } catch (error: any) {
        console.error("❌ Cleanup failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected.");
    }
}

run().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
