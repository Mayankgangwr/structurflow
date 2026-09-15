import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, DocumentServiceError } from "@/lib/services/document.service";
import { DocumentValidationError } from "@/lib/validations/document";

interface RouteParams {
    params: Promise<{
        docId: string;
    }>;
}

/**
 * GET /api/documents/detail/[docId] — Get document detail with audit trail and downloadUrl
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { docId } = await params;

        if (!docId) {
            return NextResponse.json(
                { success: false, message: "Document ID is required" },
                { status: 400 }
            );
        }

        const result = await documentService.getDocumentDetails(docId, organizationId);

        return NextResponse.json({
            success: true,
            data: result,
            message: "Document details fetched successfully",
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
        console.error("[GET /api/documents/detail/[docId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to fetch document detail" },
            { status: 500 }
        );
    }
}
