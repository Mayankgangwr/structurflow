import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, requireRole, DocumentServiceError } from "@/lib/services/document.service";
import { documentQuerySchema, DocumentValidationError } from "@/lib/validations/document";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/documents/[id] — List documents for a specific project (where id = projectId)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { id: projectId } = await params;

        const { searchParams } = new URL(req.url);
        const queryParams = {
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
            search: searchParams.get("search") || undefined,
            status: searchParams.get("status") || undefined,
            sortBy: searchParams.get("sortBy") || undefined,
            sortOrder: searchParams.get("sortOrder") || undefined,
        };

        const validatedQuery = documentQuerySchema.parse(queryParams);
        const result = await documentService.getDocumentsList(projectId, organizationId, validatedQuery);

        return NextResponse.json({
            success: true,
            data: result,
            message: "Documents fetched successfully",
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
        console.error("[GET /api/documents/[id] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to fetch project documents" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/documents/[id] — Soft delete document (where id = documentId, OWNER/ADMIN only)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        requireRole(membership.role, ["OWNER", "ADMIN"]);

        const { id: documentId } = await params;
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await documentService.deleteDocument({
            documentId,
            organizationId,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Document deleted successfully",
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
        console.error("[DELETE /api/documents/[id] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to delete document" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/documents/[id] - Update document AI generated JSON (where id = documentId, OWNER/ADMIN/Reviewer only)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        requireRole(membership.role, ["OWNER", "ADMIN", "REVIEWER"]);

        const { id: documentId } = await params;
        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const body = await req.json().catch(() => ({}));
        const updates = body?.updates || body?.data || body || {};

        const result = await documentService.updateDocumentAIGeneratedJSON({
            documentId,
            organizationId,
            updates,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Document AI generated data updated successfully",
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
        console.error("[PUT /api/documents/[id] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to update document" },
            { status: 500 }
        );
    }
}
