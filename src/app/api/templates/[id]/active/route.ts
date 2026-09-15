import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { templateService, TemplateServiceError } from "@/lib/services/template.service";
import { setActiveTemplateSchema } from "@/lib/validations/template";

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

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        if (!canManageTemplates(membership.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Only organization owners and admins can set the active template." } },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await req.json();
        const { projectId } = setActiveTemplateSchema.parse(body);

        const result = await templateService.setActiveTemplate({
            organizationId,
            userId: user.id,
            templateId: id,
            projectId,
            metadata: requestMetadata(req),
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, message: error.issues[0]?.message ?? "Validation error" },
                { status: 400 }
            );
        }
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
        console.error("[PUT /api/templates/[id]/active error]:", error);
        return NextResponse.json({ success: false, message: "Failed to set active template" }, { status: 500 });
    }
}
