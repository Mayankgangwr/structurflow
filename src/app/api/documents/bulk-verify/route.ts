import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, requireRole, DocumentServiceError } from "@/lib/services/document.service";
import { bulkVerifyDocumentsSchema, DocumentValidationError } from "@/lib/validations/document";

/**
 * POST /api/documents/bulk-verify — Bulk verify documents
 * Restricted to OWNER, ADMIN, REVIEWER
 */
export async function POST(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        requireRole(membership.role, ["OWNER", "ADMIN", "REVIEWER"]);

        const body = await req.json().catch(() => ({}));
        const { documentIds } = bulkVerifyDocumentsSchema.parse(body);

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await documentService.bulkVerifyDocuments({
            documentIds,
            organizationId,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Bulk verification completed",
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
        console.error("[POST /api/documents/bulk-verify error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to bulk verify documents" },
            { status: 500 }
        );
    }
}
