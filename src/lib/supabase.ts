import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

// Server-side client with service role key for storage operations
export const supabase = createClient(supabaseUrl, supabaseSecretKey);

export const BUCKET_NAME = process.env.SUPABASE_TEMPLATES_BUCKET || "templates";
export const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || "documents";

let isBucketEnsured = false;
let isDocsBucketEnsured = false;

export async function ensureTemplatesBucket(bucketName: string = BUCKET_NAME): Promise<void> {
    if (isBucketEnsured) return;
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === bucketName || b.id === bucketName);
        if (!exists) {
            await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 52428800, // 50MB
            });
        }
        isBucketEnsured = true;
    } catch (err) {
        console.warn("[Supabase] Failed to auto-ensure storage bucket:", err);
    }
}

export async function ensureDocumentsBucket(bucketName: string = DOCUMENTS_BUCKET): Promise<void> {
    if (isDocsBucketEnsured) return;
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === bucketName || b.id === bucketName);
        if (!exists) {
            await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 52428800, // 50MB
            });
        }
        isDocsBucketEnsured = true;
    } catch (err) {
        console.warn("[Supabase] Failed to auto-ensure documents bucket:", err);
    }
}

