import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, requireRole, DocumentServiceError } from "@/lib/services/document.service";
import { rejectDocumentSchema, DocumentValidationError } from "@/lib/validations/document";

interface RouteParams {
    params: Promise<{
        docId: string;
    }>;
}

/**
 * PUT /api/documents/reject/[docId] — Reject a document with optional reason
 * Restricted to OWNER, ADMIN, REVIEWER
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        requireRole(membership.role, ["OWNER", "ADMIN", "REVIEWER"]);

        const { docId } = await params;
        const body = await req.json().catch(() => ({}));
        const { reason } = rejectDocumentSchema.parse(body);

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await documentService.rejectDocument({
            documentId: docId,
            organizationId,
            reason,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Document rejected successfully",
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
        console.error("[PUT /api/documents/reject/[docId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to reject document" },
            { status: 500 }
        );
    }
}
