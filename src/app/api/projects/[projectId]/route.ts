import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { projectService } from "@/lib/services/project.service";
import { updateProjectSchema } from "@/lib/validations/project";
import { z } from "zod";

interface RouteParams {
    params: Promise<{
        projectId: string;
    }>;
}

const canManageProjects = (role: string) => ["OWNER", "ADMIN"].includes(role.toUpperCase());

const requestMetadata = (request: NextRequest) => ({
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        const found = await projectService.getProjectById(projectId, organizationId);

        if (!found) {
            return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: found,
            message: "Project fetched successfully",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[GET /api/projects/[projectId] error]:", error);
        return NextResponse.json(
            { success: false, error: { code: "PROJECT_GET_FAILED", message: "Failed to fetch project" } },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        if (!canManageProjects(membership.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Only organization owners and admins can update projects." } },
                { status: 403 }
            );
        }
        const { projectId } = await params;

        const body = updateProjectSchema.parse(await req.json());
        const updated = await projectService.updateProject(projectId, organizationId, user.id, body, requestMetadata(req));

        if (!updated) {
            return NextResponse.json({ success: false, message: "Project not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updated,
            message: "Project updated successfully",
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid project data" } },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[PATCH /api/projects/[projectId] error]:", error);
        return NextResponse.json(
            { success: false, error: { code: "PROJECT_UPDATE_FAILED", message: "Failed to update project" } },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        if (!canManageProjects(membership.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Only organization owners and admins can delete projects." } },
                { status: 403 }
            );
        }
        const { projectId } = await params;

        const deleted = await projectService.deleteProject(projectId, organizationId, user.id, requestMetadata(req));

        if (!deleted) {
            return NextResponse.json({ success: false, message: "Project not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: deleted,
            message: "Project deleted successfully",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[DELETE /api/projects/[projectId] error]:", error);
        return NextResponse.json(
            { success: false, error: { code: "PROJECT_DELETE_FAILED", message: "Failed to delete project" } },
            { status: 500 }
        );
    }
}
