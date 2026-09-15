import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { templateService, TemplateServiceError } from "@/lib/services/template.service";
import { processTemplateSchema } from "@/lib/validations/template";

const canManageTemplates = (role: string) => ["OWNER", "ADMIN"].includes(role.toUpperCase());

const requestMetadata = (request: NextRequest) => ({
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
});

const errorResponse = (message: string, status: number, code: string) =>
    NextResponse.json({ success: false, error: { code, message }, message }, { status });

export async function PUT(request: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(request);
        if (!canManageTemplates(membership.role)) {
            return errorResponse("Only organization owners and admins can process templates.", 403, "FORBIDDEN");
        }

        const body = await request.json();
        const { templateId } = processTemplateSchema.parse(body);

        const result = await templateService.processTemplate({
            organizationId,
            userId: user.id,
            templateId,
            metadata: requestMetadata(request),
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Template processed successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return errorResponse(error.issues[0]?.message ?? "Invalid template request.", 400, "VALIDATION_ERROR");
        }
        if (error instanceof TemplateServiceError) {
            return errorResponse(error.message, error.statusCode, error.code);
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        if (message === "ORGANIZATION_REQUIRED") return errorResponse("No active organization found", 400, "ORGANIZATION_REQUIRED");
        console.error("[PUT /api/templates/proccess]", error);
        return errorResponse("Failed to process template", 500, "TEMPLATE_PROCESS_FAILED");
    }
}
