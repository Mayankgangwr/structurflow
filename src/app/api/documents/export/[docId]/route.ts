import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, DocumentServiceError } from "@/lib/services/document.service";
import { updateDocumentStatusSchema, DocumentValidationError } from "@/lib/validations/document";

interface RouteParams {
    params: Promise<{
        docId: string;
    }>;
}

/**
 * PUT /api/documents/export/[docId] — Export a document
 * Returns { success: true, data: downloadUrl }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId } = await getAuthenticatedUserAndOrg(req);
        const { docId } = await params;
        const body = await req.json().catch(() => ({}));
        const { status } = updateDocumentStatusSchema.parse(body);

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const downloadUrl = await documentService.updateDocumentStatus({
            documentId: docId,
            organizationId,
            status,
            userId: user.id,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: downloadUrl,
            message: "Document status updated successfully",
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
        console.error("[PUT /api/documents/export/[docId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to export document" },
            { status: 500 }
        );
    }
}
