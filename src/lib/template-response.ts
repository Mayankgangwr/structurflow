import { supabase, BUCKET_NAME } from "@/lib/supabase";
import type { template } from "@/schema";

type TemplateRecord = typeof template.$inferSelect;

export async function toTemplateResponse(record: TemplateRecord) {
    let secureUrl = record.secureUrl;
    try {
        const { data } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(record.publicId, 3600);
        secureUrl = data?.signedUrl ?? secureUrl;
    } catch {
        // A persisted URL is returned if signed-URL generation is temporarily unavailable.
    }

    return {
        _id: record.id,
        organizationId: record.organizationId,
        projectId: record.projectId,
        uploadedById: record.uploadedById ?? "",
        documentType: "TEMPLATE" as const,
        originalFileName: record.originalFileName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        fileHash: record.fileHash,
        publicId: record.publicId,
        secureUrl,
        status: record.status,
        isActive: record.isActive,
        processingProgress: record.processingProgress,
        processingError: record.processingError,
        pageCount: record.pageCount,
        pageWidth: record.pageWidth,
        pageHeight: record.pageHeight,
        extractedData: record.extractedData,
        htmlContent: record.htmlContent,
        templateSchema: record.templateSchema,
        extractedElements: record.extractedElements,
        version: record.version,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

export async function toTemplateResponses(records: TemplateRecord[]) {
    const signedUrls = new Map<string, string>();
    try {
        const { data } = await supabase.storage.from(BUCKET_NAME).createSignedUrls(records.map((record) => record.publicId), 3600);
        data?.forEach((signedUrl, index) => {
            if (signedUrl.signedUrl) signedUrls.set(records[index].id, signedUrl.signedUrl);
        });
    } catch {
        // A persisted URL is returned for affected records.
    }

    return records.map((record) => ({
        _id: record.id,
        organizationId: record.organizationId,
        projectId: record.projectId,
        uploadedById: record.uploadedById ?? "",
        documentType: "TEMPLATE" as const,
        originalFileName: record.originalFileName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        fileHash: record.fileHash,
        publicId: record.publicId,
        secureUrl: signedUrls.get(record.id) ?? record.secureUrl,
        status: record.status,
        isActive: record.isActive,
        pageCount: record.pageCount,
        htmlContent: record.htmlContent,
        templateSchema: record.templateSchema,
        extractedElements: record.extractedElements,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    }));
}
