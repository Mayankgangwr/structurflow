import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project } from "@/schema";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { and, eq } from "drizzle-orm";

interface RouteParams {
    params: Promise<{
        projectId: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        const found = await db
            .select()
            .from(project)
            .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
            .limit(1);

        if (found.length === 0) {
            return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
        }

        const p = found[0];

        return NextResponse.json({
            success: true,
            data: {
                id: p.id,
                name: p.name,
                description: p.description || "",
                status: p.status as "Active" | "Inactive",
                documents: 0,
                processing: 0,
                needsVerification: 0,
                successRate: 100,
                lastActivity: p.updatedAt ? p.updatedAt.toISOString() : p.createdAt.toISOString(),
                activeTemplateId: p.templateDocumentId || null,
                templateData: null,
            },
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[GET /api/projects/[projectId] error]:", error);
        return NextResponse.json({ success: false, message: error?.message || "Failed to fetch project" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        const body = await req.json();
        const { name, description, status } = body;

        const updates: Partial<{
            name: string;
            description: string;
            status: string;
            updatedAt: Date;
        }> = {
            updatedAt: new Date(),
        };

        if (name && typeof name === "string" && name.trim().length >= 3) {
            updates.name = name.trim();
        }

        if (description !== undefined && typeof description === "string") {
            updates.description = description.trim();
        }

        if (status && (status === "Active" || status === "Inactive")) {
            updates.status = status;
        }

        const updated = await db
            .update(project)
            .set(updates)
            .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ success: false, message: "Project not found or unauthorized" }, { status: 404 });
        }

        const p = updated[0];

        return NextResponse.json({
            success: true,
            data: {
                id: p.id,
                name: p.name,
                description: p.description || "",
                status: p.status as "Active" | "Inactive",
                documents: 0,
                processing: 0,
                needsVerification: 0,
                successRate: 100,
                lastActivity: p.updatedAt.toISOString(),
                activeTemplateId: p.templateDocumentId || null,
                templateData: null,
            },
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[PATCH /api/projects/[projectId] error]:", error);
        return NextResponse.json({ success: false, message: error?.message || "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const { projectId } = await params;

        const deleted = await db
            .delete(project)
            .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ success: false, message: "Project not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: deleted[0].id,
            },
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[DELETE /api/projects/[projectId] error]:", error);
        return NextResponse.json({ success: false, message: error?.message || "Failed to delete project" }, { status: 500 });
    }
}
