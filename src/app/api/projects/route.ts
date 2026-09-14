import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { project } from "@/schema";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { and, eq, ilike, or, count, desc, asc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
        const search = searchParams.get("search")?.trim() || "";
        const status = searchParams.get("status") || "ALL";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        const offset = (page - 1) * limit;

        // Build where conditions
        const conditions = [eq(project.organizationId, organizationId)];

        if (status && status !== "ALL") {
            conditions.push(eq(project.status, status));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(project.name, `%${search}%`),
                    ilike(project.description, `%${search}%`)
                )!
            );
        }

        const whereClause = and(...conditions);

        // Get total count
        const totalResult = await db
            .select({ count: count() })
            .from(project)
            .where(whereClause);
        const total = totalResult[0]?.count || 0;

        // Order clause
        let orderByField;
        if (sortBy === "name") {
            orderByField = sortOrder === "asc" ? asc(project.name) : desc(project.name);
        } else if (sortBy === "updatedAt") {
            orderByField = sortOrder === "asc" ? asc(project.updatedAt) : desc(project.updatedAt);
        } else {
            orderByField = sortOrder === "asc" ? asc(project.createdAt) : desc(project.createdAt);
        }

        // Fetch projects
        const projectRows = await db
            .select()
            .from(project)
            .where(whereClause)
            .orderBy(orderByField)
            .limit(limit)
            .offset(offset);

        // Format according to Project interface
        const formattedProjects = projectRows.map((p) => ({
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
        }));

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: {
                projects: formattedProjects,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
                meta: {
                    totalProjects: total,
                    totalPendingVerification: 0,
                },
            },
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        console.error("[GET /api/projects error]:", error);
        return NextResponse.json({ success: false, message: error?.message || "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, organizationId } = await getAuthenticatedUserAndOrg(req);

        const body = await req.json();
        const { name, description = "", templateDocumentId = null } = body;

        if (!name || typeof name !== "string" || name.trim().length < 3) {
            return NextResponse.json(
                { success: false, message: "Project name must be at least 3 characters long" },
                { status: 400 }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                { success: false, message: "Project name must not exceed 100 characters" },
                { status: 400 }
            );
        }

        const projectId = "proj_" + crypto.randomUUID().replace(/-/g, "");

        const newProject = await db
            .insert(project)
            .values({
                id: projectId,
                organizationId,
                createdById: user.id,
                name: name.trim(),
                description: typeof description === "string" ? description.trim() : "",
                status: "Active",
                templateDocumentId: templateDocumentId || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        const p = newProject[0];

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
        console.error("[POST /api/projects error]:", error);
        return NextResponse.json({ success: false, message: error?.message || "Failed to create project" }, { status: 500 });
    }
}
