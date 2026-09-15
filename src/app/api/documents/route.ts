import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, requireRole, DocumentServiceError } from "@/lib/services/document.service";
import { validateDocumentUpload, documentQuerySchema, DocumentValidationError } from "@/lib/validations/document";

/**
 * GET /api/documents — Organization-level document workspace (with stats & pagination)
 */
export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { searchParams } = new URL(req.url);

        const queryParams = {
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
            search: searchParams.get("search") || undefined,
            status: searchParams.get("status") || undefined,
            projectId: searchParams.get("projectId") || undefined,
            sortBy: searchParams.get("sortBy") || undefined,
            sortOrder: searchParams.get("sortOrder") || undefined,
        };

        const validatedQuery = documentQuerySchema.parse(queryParams);
        const result = await documentService.getOrganizationDocuments(organizationId, validatedQuery);

        return NextResponse.json({
            success: true,
            data: result,
            message: "Organization documents fetched successfully",
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        if (error instanceof DocumentServiceError || error instanceof DocumentValidationError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
        }
        console.error("[GET /api/documents error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/documents — Multi-file document upload (OWNER, ADMIN only)
 */
export async function POST(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        requireRole(membership.role, ["OWNER", "ADMIN"]);

        const formData = await req.formData();
        const projectId = formData.get("projectId");

        // Collect all files from "files" or single "file"
        const allFiles = formData.getAll("files");
        const singleFile = formData.get("file");
        const rawFilesList = allFiles.length > 0 ? allFiles : singleFile ? [singleFile] : [];

        const { files, projectId: validatedProjectId } = validateDocumentUpload(rawFilesList, projectId);

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const results = await documentService.uploadDocuments({
            files,
            organizationId,
            projectId: validatedProjectId,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: {
                count: results.length,
                documents: results.map((r) => r.document),
                results,
            },
            message: "Documents uploaded successfully",
        }, { status: 201 });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        if (error instanceof DocumentServiceError || error instanceof DocumentValidationError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
        }
        console.error("[POST /api/documents error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to upload documents" },
            { status: 500 }
        );
    }
}
