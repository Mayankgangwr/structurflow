import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { templateService, TemplateServiceError } from "@/lib/services/template.service";

interface RouteParams {
    params: Promise<{
        projectId: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        const data = await templateService.listProjectTemplates(organizationId, projectId);

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error: unknown) {
        if (error instanceof TemplateServiceError) {
            return NextResponse.json(
                { success: false, message: error.message, error: { code: error.code, message: error.message } },
                { status: error.statusCode }
            );
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[GET /api/templates/project/[projectId] error]:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch project templates" }, { status: 500 });
    }
}
