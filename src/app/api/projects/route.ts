import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { projectService } from "@/lib/services/project.service";
import { createProjectSchema, getProjectsQuerySchema } from "@/lib/validations/project";
import { z } from "zod";

const canManageProjects = (role: string) => ["OWNER", "ADMIN"].includes(role.toUpperCase());

const requestMetadata = (request: NextRequest) => ({
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
});

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = getProjectsQuerySchema.parse(searchParams);

        const result = await projectService.listProjects(organizationId, queryOptions);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid query parameters" } },
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
        console.error("[GET /api/projects error]:", error);
        return NextResponse.json(
            { success: false, error: { code: "PROJECT_LIST_FAILED", message: "Failed to fetch projects" } },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        if (!canManageProjects(membership.role)) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Only organization owners and admins can create projects." } },
                { status: 403 }
            );
        }

        const body = createProjectSchema.parse(await req.json());
        const newProject = await projectService.createProject(organizationId, user.id, body, requestMetadata(req));

        return NextResponse.json(
            {
                success: true,
                message: "Project created successfully",
                data: newProject,
            },
            { status: 201 }
        );
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
        console.error("[POST /api/projects error]:", error);
        return NextResponse.json(
            { success: false, error: { code: "PROJECT_CREATE_FAILED", message: "Failed to create project" } },
            { status: 500 }
        );
    }
}
