import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { documentService, DocumentServiceError } from "@/lib/services/document.service";
import { DocumentValidationError } from "@/lib/validations/document";

interface RouteParams {
    params: Promise<{
        projectId: string;
    }>;
}

/**
 * GET /api/documents/summary/[projectId] — Summary statistics for documents in a project
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { success: false, message: "Project ID is required" },
                { status: 400 }
            );
        }

        const summary = await documentService.getDocumentSummary(projectId, organizationId);

        return NextResponse.json({
            success: true,
            data: summary,
            message: "Documents summary fetched successfully",
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
        console.error("[GET /api/documents/summary/[projectId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to fetch document summary" },
            { status: 500 }
        );
    }
}
