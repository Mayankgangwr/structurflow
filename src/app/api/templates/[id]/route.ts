import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { templateService } from "@/lib/services/template.service";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

const canManageTemplates = (role: string) => ["OWNER", "ADMIN"].includes(role.toUpperCase());

const requestMetadata = (request: NextRequest) => ({
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { id } = await params;

        const result = await templateService.getTemplateById(organizationId, id);

        if (!result) {
            return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[GET /api/templates/[id] error]:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch template" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        if (!canManageTemplates(membership.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Only organization owners and admins can delete templates." } },
                { status: 403 }
            );
        }

        const { id } = await params;

        const result = await templateService.deleteTemplate({
            organizationId,
            userId: user.id,
            templateId: id,
            metadata: requestMetadata(req),
        });

        if (!result) {
            return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[DELETE /api/templates/[id] error]:", error);
        return NextResponse.json({ success: false, message: "Failed to delete template" }, { status: 500 });
    }
}
