import path from "path";
import dotenv from "dotenv";

// Ensure environment variables are loaded regardless of execution working directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import { connectDatabase } from "@/config/database";
import { DocumentModel } from "@/models/document.model";
import { TemplateModel } from "@/models/template.model";
import { ProjectModel } from "@/models/project.model";
import { AuditLogModel, AuditAction } from "@/models/audit-log.model";
import { supabaseAdmin } from "@/config/supabase";

interface ScriptOptions {
    projectId?: string;
    orgId?: string;
    skipStorage: boolean;
    dryRun: boolean;
}

function parseArguments(): ScriptOptions {
    const args = process.argv.slice(2);
    const options: ScriptOptions = {
        skipStorage: false,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--projectId" || arg === "-p") {
            options.projectId = args[++i];
        } else if (arg === "--orgId" || arg === "-o") {
            options.orgId = args[++i];
        } else if (arg === "--skip-storage") {
            options.skipStorage = true;
        } else if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg === "--help" || arg === "-h") {
            console.log(`
Usage: npx tsx src/scripts/clean-docs-and-templates.ts [options]

Options:
  -p, --projectId <id>   Target only documents & templates in this project ID
  -o, --orgId <id>       Target only documents & templates in this organization ID
  --skip-storage         Only remove database records; skip deleting Supabase storage files
  --dry-run              Report what would be deleted without making any changes
  -h, --help             Display this help message
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

async function runCleanup() {
    const options = parseArguments();

    console.log("==================================================");
    console.log("🧹 StructurFlow Document & Template Cleanup Script");
    console.log("==================================================");
    if (options.dryRun) {
        console.log("🔍 MODE: DRY-RUN (No data will be deleted)");
    }
    if (options.projectId) {
        console.log(`🎯 Target Project ID: ${options.projectId}`);
    }
    if (options.orgId) {
        console.log(`🏢 Target Org ID:     ${options.orgId}`);
    }
    if (options.skipStorage) {
        console.log("📦 Supabase Storage:  SKIPPED (--skip-storage flag active)");
    }
    console.log("--------------------------------------------------");

    await connectDatabase();

    try {
        // Build base query
        const docQuery: Record<string, any> = {};
        const templateQuery: Record<string, any> = {};
        const projectQuery: Record<string, any> = {};

        if (options.projectId) {
            const projectObjectId = new mongoose.Types.ObjectId(options.projectId);
            docQuery.projectId = projectObjectId;
            templateQuery.projectId = projectObjectId;
            projectQuery._id = projectObjectId;
        }

        if (options.orgId) {
            const orgObjectId = new mongoose.Types.ObjectId(options.orgId);
            docQuery.organizationId = orgObjectId;
            templateQuery.organizationId = orgObjectId;
            projectQuery.organizationId = orgObjectId;
        }

        // 1. Find matching documents & templates
        const documents = await DocumentModel.find(docQuery).select("_id originalFileName publicId").lean();
        const templates = await TemplateModel.find(templateQuery).select("_id originalFileName publicId").lean();

        console.log(`📄 Found ${documents.length} document(s) matching criteria.`);
        console.log(`📑 Found ${templates.length} template(s) matching criteria.`);

        const docIds = documents.map((d) => d._id);
        const templateIds = templates.map((t) => t._id);

        const storagePathsToDelete: string[] = [
            ...documents.map((d) => d.publicId).filter(Boolean),
            ...templates.map((t) => t.publicId).filter(Boolean)
        ];

        console.log(`📦 Found ${storagePathsToDelete.length} storage file reference(s).`);

        if (options.dryRun) {
            console.log("\n[DRY-RUN Summary]");
            console.log(`- Documents to delete: ${documents.length}`);
            console.log(`- Templates to delete: ${templates.length}`);
            console.log(`- Storage files to delete: ${storagePathsToDelete.length}`);
            console.log("No changes made.");
            await mongoose.disconnect();
            return;
        }

        // 2. Delete files from Supabase Storage
        let storageStats = { deleted: 0, errors: 0 };
        if (!options.skipStorage && storagePathsToDelete.length > 0) {
            console.log("\n🗑️  Deleting files from Supabase Storage...");
            storageStats = await removeStorageFiles(storagePathsToDelete);
            console.log(`   ✅ Storage removal finished: ${storageStats.deleted} deleted, ${storageStats.errors} errors.`);
        }

        // 3. Delete Document records
        console.log("\n🗑️  Deleting Documents from MongoDB...");
        const docDeleteResult = await DocumentModel.deleteMany(docQuery);
        console.log(`   ✅ Deleted ${docDeleteResult.deletedCount} document record(s).`);

        // 4. Delete Template records
        console.log("\n🗑️  Deleting Templates from MongoDB...");
        const templateDeleteResult = await TemplateModel.deleteMany(templateQuery);
        console.log(`   ✅ Deleted ${templateDeleteResult.deletedCount} template record(s).`);

        // 5. Reset template references on affected projects
        console.log("\n🔄 Clearing templateDocumentId references on Projects...");
        let projectUpdateResult;
        if (options.projectId) {
            projectUpdateResult = await ProjectModel.updateMany(
                { _id: new mongoose.Types.ObjectId(options.projectId) },
                { $unset: { templateDocumentId: "" } }
            );
        } else if (options.orgId) {
            projectUpdateResult = await ProjectModel.updateMany(
                { organizationId: new mongoose.Types.ObjectId(options.orgId) },
                { $unset: { templateDocumentId: "" } }
            );
        } else {
            projectUpdateResult = await ProjectModel.updateMany(
                { templateDocumentId: { $exists: true, $ne: null } },
                { $unset: { templateDocumentId: "" } }
            );
        }
        console.log(`   ✅ Cleared templateDocumentId on ${projectUpdateResult.modifiedCount} project(s).`);

        // 6. Delete related audit logs
        console.log("\n📋 Cleaning up related Audit Logs...");
        const auditLogConditions: any[] = [
            {
                action: {
                    $in: [
                        AuditAction.DOCUMENT_UPLOADED,
                        AuditAction.TEMPLATE_UPLOADED,
                        AuditAction.DOCUMENT_DELETED,
                        AuditAction.DOCUMENT_STATUS_CHANGED,
                        AuditAction.EXTRACTION_APPROVED,
                        AuditAction.EXTRACTION_REJECTED
                    ]
                }
            }
        ];

        if (docIds.length > 0) {
            auditLogConditions.push({ documentId: { $in: docIds } });
        }
        if (templateIds.length > 0) {
            auditLogConditions.push({ documentId: { $in: templateIds } });
        }

        const auditQuery: Record<string, any> = { $or: auditLogConditions };
        if (options.orgId) {
            auditQuery.organizationId = new mongoose.Types.ObjectId(options.orgId);
        }

        const auditDeleteResult = await AuditLogModel.deleteMany(auditQuery);
        console.log(`   ✅ Deleted ${auditDeleteResult.deletedCount} audit log record(s).`);

        console.log("\n==================================================");
        console.log("✨ Cleanup Complete!");
        console.log("==================================================");
        console.log(`- Documents Deleted:    ${docDeleteResult.deletedCount}`);
        console.log(`- Templates Deleted:    ${templateDeleteResult.deletedCount}`);
        console.log(`- Projects Updated:     ${projectUpdateResult.modifiedCount}`);
        console.log(`- Audit Logs Deleted:   ${auditDeleteResult.deletedCount}`);
        if (!options.skipStorage) {
            console.log(`- Storage Files Purged: ${storageStats.deleted}`);
        }
        console.log("==================================================");
    } catch (error: any) {
        console.error("❌ Cleanup failed with error:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB disconnected.");
    }
}

// Execute script
runCleanup().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
