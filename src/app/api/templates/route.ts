import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { toTemplateResponses } from "@/lib/template-response";
import { template } from "@/schema";
import { templateService, TemplateServiceError } from "@/lib/services/template.service";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const canManageTemplates = (role: string) => ["OWNER", "ADMIN"].includes(role.toUpperCase());

const requestMetadata = (request: NextRequest) => ({
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
});

const errorResponse = (message: string, status: number, code: string) =>
    NextResponse.json({ success: false, error: { code, message }, message }, { status });

export async function GET(request: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(request);
        const records = await db.select().from(template).where(and(
            eq(template.organizationId, organizationId),
            eq(template.isDeleted, false),
        )).orderBy(desc(template.createdAt));

        return NextResponse.json({ success: true, data: await toTemplateResponses(records) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        if (message === "ORGANIZATION_REQUIRED") return errorResponse("No active organization found", 400, "ORGANIZATION_REQUIRED");
        console.error("[GET /api/templates]", error);
        return errorResponse("Failed to fetch templates", 500, "TEMPLATE_LIST_FAILED");
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(request);
        if (!canManageTemplates(membership.role)) {
            return errorResponse("Only organization owners and admins can upload templates.", 403, "FORBIDDEN");
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const projectId = formData.get("projectId");
        if (!(file instanceof File)) return errorResponse("A template file is required.", 400, "FILE_REQUIRED");
        if (typeof projectId !== "string" || !projectId.trim()) return errorResponse("projectId is required.", 400, "PROJECT_ID_REQUIRED");
        if (!allowedMimeTypes.has(file.type)) return errorResponse("Unsupported file type. Upload a PDF, JPG, PNG, or DOCX file.", 400, "UNSUPPORTED_FILE_TYPE");
        if (file.size === 0 || file.size > MAX_FILE_SIZE) return errorResponse("Template file must be between 1 byte and 25 MB.", 400, "INVALID_FILE_SIZE");

        const result = await templateService.uploadTemplate({
            organizationId,
            userId: user.id,
            projectId,
            file,
            metadata: requestMetadata(request),
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Template uploaded successfully",
        }, { status: 201 });
    } catch (error) {
        if (error instanceof TemplateServiceError) {
            return errorResponse(error.message, error.statusCode, error.code);
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        if (message === "ORGANIZATION_REQUIRED") return errorResponse("No active organization found", 400, "ORGANIZATION_REQUIRED");
        console.error("[POST /api/templates]", error);
        return errorResponse("Failed to upload template", 500, "TEMPLATE_UPLOAD_FAILED");
    }
}
