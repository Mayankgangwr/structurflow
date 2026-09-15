import { db } from "@/lib/db";
import { project, template, document } from "@/schema";
import { supabase, BUCKET_NAME } from "@/lib/supabase";
import { and, eq, ilike, or, count, desc, asc, inArray, sql } from "drizzle-orm";
import { writeAuditLog } from "@/lib/audit-log";
import crypto from "crypto";
import type { CreateProjectInput, UpdateProjectInput, GetProjectsQueryInput } from "@/lib/validations/project";

export interface RequestMetadata {
    ipAddress?: string | null;
    userAgent?: string | null;
}

export interface FormattedProject {
    id: string;
    name: string;
    description: string;
    status: "Active" | "Inactive";
    documents: number;
    processing: number;
    needsVerification: number;
    successRate: number;
    lastActivity: string;
    activeTemplateId?: string | null;
    templateData?: any | null;
}

export class ProjectService {
    /**
     * Resolves the active template for a given project with a fresh signed URL from Supabase.
     */
    async getProjectActiveTemplate(projectId: string, organizationId: string, templateDocumentId?: string | null) {
        let activeTemplateRow = null;

        if (templateDocumentId) {
            const tRows = await db
                .select()
                .from(template)
                .where(and(
                    eq(template.id, templateDocumentId),
                    eq(template.organizationId, organizationId),
                    eq(template.isDeleted, false)
                ))
                .limit(1);
            if (tRows.length > 0) activeTemplateRow = tRows[0];
        }

        if (!activeTemplateRow) {
            const tRows = await db
                .select()
                .from(template)
                .where(and(
                    eq(template.projectId, projectId),
                    eq(template.organizationId, organizationId),
                    eq(template.isActive, true),
                    eq(template.isDeleted, false)
                ))
                .limit(1);
            if (tRows.length > 0) activeTemplateRow = tRows[0];
        }

        if (!activeTemplateRow) return null;

        let secureUrl = activeTemplateRow.secureUrl;
        try {
            const { data: signedData } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(activeTemplateRow.publicId, 3600);
            if (signedData?.signedUrl) {
                secureUrl = signedData.signedUrl;
            }
        } catch {
            // Fall back to stored URL
        }

        return {
            _id: activeTemplateRow.id,
            organizationId: activeTemplateRow.organizationId,
            projectId: activeTemplateRow.projectId,
            uploadedById: activeTemplateRow.uploadedById || "",
            documentType: "TEMPLATE" as const,
            originalFileName: activeTemplateRow.originalFileName,
            mimeType: activeTemplateRow.mimeType,
            sizeBytes: activeTemplateRow.sizeBytes,
            fileHash: activeTemplateRow.fileHash,
            publicId: activeTemplateRow.publicId,
            secureUrl,
            status: activeTemplateRow.status,
            isActive: activeTemplateRow.isActive,
            createdAt: activeTemplateRow.createdAt.toISOString(),
            updatedAt: activeTemplateRow.updatedAt.toISOString(),
            htmlContent: activeTemplateRow.htmlContent || undefined,
            templateSchema: activeTemplateRow.templateSchema || undefined,
            extractedElements: activeTemplateRow.extractedElements || undefined,
        };
    }

    /**
     * Lists all projects belonging to an organization with dynamic document stats and pagination.
     */
    async listProjects(organizationId: string, options: GetProjectsQueryInput) {
        const { page, limit, search, status, sortBy, sortOrder } = options;
        const offset = (page - 1) * limit;

        const conditions = [
            eq(project.organizationId, organizationId),
            eq(project.isDeleted, false)
        ];

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

        // Determine ordering
        let orderByField;
        if (sortBy === "name") {
            orderByField = sortOrder === "asc" ? asc(project.name) : desc(project.name);
        } else if (sortBy === "updatedAt" || sortBy === "lastActivity") {
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

        const projectIds = projectRows.map((p) => p.id);

        // Fetch active templates in bulk
        const templateRows = projectIds.length > 0
            ? await db
                .select()
                .from(template)
                .where(and(
                    inArray(template.projectId, projectIds),
                    eq(template.organizationId, organizationId),
                    eq(template.isActive, true),
                    eq(template.isDeleted, false)
                ))
            : [];
        const templateByProjectId = new Map(templateRows.map((t) => [t.projectId, t]));

        // Fetch document counts for these projects
        const docRows = projectIds.length > 0
            ? await db
                .select({
                    projectId: document.projectId,
                    total: sql<number>`count(*)::int`,
                    processing: sql<number>`count(*) filter (where ${document.status} = 'PROCESSING')::int`,
                    needsVerification: sql<number>`count(*) filter (where ${document.status} = 'REVIEW_REQUIRED')::int`,
                    verified: sql<number>`count(*) filter (where ${document.status} in ('VERIFIED', 'EXPORTED'))::int`,
                })
                .from(document)
                .where(and(
                    inArray(document.projectId, projectIds),
                    eq(document.organizationId, organizationId),
                    eq(document.isDeleted, false)
                ))
                .groupBy(document.projectId)
            : [];

        const docStatsByProjectId = new Map(docRows.map((row) => [row.projectId, row]));

        // Batch sign URLs for active templates
        const signedTemplateUrls = new Map<string, string>();
        if (templateRows.length > 0) {
            try {
                const { data } = await supabase.storage
                    .from(BUCKET_NAME)
                    .createSignedUrls(templateRows.map((row) => row.publicId), 3600);
                data?.forEach((signed, index) => {
                    if (signed.signedUrl) signedTemplateUrls.set(templateRows[index].id, signed.signedUrl);
                });
            } catch {
                // Fall back to stored URLs
            }
        }

        let totalPendingVerification = 0;

        const formattedProjects: FormattedProject[] = projectRows.map((p) => {
            const t = templateByProjectId.get(p.id);
            const ds = docStatsByProjectId.get(p.id) || { total: 0, processing: 0, needsVerification: 0, verified: 0 };
            totalPendingVerification += ds.needsVerification;

            const successRate = ds.total > 0 ? Math.round((ds.verified / ds.total) * 100) : 100;

            let templateData = null;
            if (t) {
                templateData = {
                    _id: t.id,
                    organizationId: t.organizationId,
                    projectId: t.projectId,
                    uploadedById: t.uploadedById || "",
                    documentType: "TEMPLATE" as const,
                    originalFileName: t.originalFileName,
                    mimeType: t.mimeType,
                    sizeBytes: t.sizeBytes,
                    fileHash: t.fileHash,
                    publicId: t.publicId,
                    secureUrl: signedTemplateUrls.get(t.id) ?? t.secureUrl,
                    status: t.status,
                    isActive: t.isActive,
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                    htmlContent: t.htmlContent || undefined,
                    templateSchema: t.templateSchema || undefined,
                    extractedElements: t.extractedElements || undefined,
                };
            }

            return {
                id: p.id,
                name: p.name,
                description: p.description || "",
                status: p.status as "Active" | "Inactive",
                documents: ds.total,
                processing: ds.processing,
                needsVerification: ds.needsVerification,
                successRate,
                lastActivity: p.updatedAt ? p.updatedAt.toISOString() : p.createdAt.toISOString(),
                activeTemplateId: t?.id || p.templateDocumentId || null,
                templateData,
            };
        });

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            projects: formattedProjects,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            meta: {
                totalProjects: total,
                totalPendingVerification,
            },
        };
    }

    /**
     * Retrieves a single project by ID with active template and real-time metrics.
     */
    async getProjectById(projectId: string, organizationId: string): Promise<FormattedProject | null> {
        const found = await db
            .select()
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (found.length === 0) {
            return null;
        }

        const p = found[0];
        const templateData = await this.getProjectActiveTemplate(p.id, organizationId, p.templateDocumentId);

        const docRows = await db
            .select({
                total: sql<number>`count(*)::int`,
                processing: sql<number>`count(*) filter (where ${document.status} = 'PROCESSING')::int`,
                needsVerification: sql<number>`count(*) filter (where ${document.status} = 'REVIEW_REQUIRED')::int`,
                verified: sql<number>`count(*) filter (where ${document.status} in ('VERIFIED', 'EXPORTED'))::int`,
            })
            .from(document)
            .where(and(
                eq(document.projectId, projectId),
                eq(document.organizationId, organizationId),
                eq(document.isDeleted, false)
            ));

        const metrics = docRows[0] ?? { total: 0, processing: 0, needsVerification: 0, verified: 0 };
        const successRate = metrics.total > 0 ? Math.round((metrics.verified / metrics.total) * 100) : 100;

        return {
            id: p.id,
            name: p.name,
            description: p.description || "",
            status: p.status as "Active" | "Inactive",
            documents: metrics.total,
            processing: metrics.processing,
            needsVerification: metrics.needsVerification,
            successRate,
            lastActivity: p.updatedAt ? p.updatedAt.toISOString() : p.createdAt.toISOString(),
            activeTemplateId: templateData?._id || p.templateDocumentId || null,
            templateData,
        };
    }

    /**
     * Creates a new project and records an audit log entry.
     */
    async createProject(
        organizationId: string,
        userId: string,
        data: CreateProjectInput,
        metadata: RequestMetadata = {}
    ): Promise<FormattedProject> {
        const projectId = "proj_" + crypto.randomUUID().replace(/-/g, "");

        const inserted = await db
            .insert(project)
            .values({
                id: projectId,
                organizationId,
                createdById: userId,
                name: data.name,
                description: data.description || "",
                status: "Active",
                templateDocumentId: null,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        const p = inserted[0];

        await writeAuditLog({
            organizationId,
            actorId: userId,
            projectId: p.id,
            action: "PROJECT_CREATED",
            details: { projectName: p.name, description: p.description ?? "", status: p.status },
            ...metadata,
        });

        return {
            id: p.id,
            name: p.name,
            description: p.description || "",
            status: p.status as "Active" | "Inactive",
            documents: 0,
            processing: 0,
            needsVerification: 0,
            successRate: 100,
            lastActivity: p.updatedAt.toISOString(),
            activeTemplateId: null,
            templateData: null,
        };
    }

    /**
     * Updates an existing project and records an audit log entry.
     */
    async updateProject(
        projectId: string,
        organizationId: string,
        userId: string,
        data: UpdateProjectInput,
        metadata: RequestMetadata = {}
    ): Promise<FormattedProject | null> {
        const updates: Partial<{
            name: string;
            description: string;
            status: string;
            updatedAt: Date;
        }> = {
            updatedAt: new Date(),
        };

        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;
        if (data.status !== undefined) updates.status = data.status;

        const updated = await db
            .update(project)
            .set(updates)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .returning();

        if (updated.length === 0) {
            return null;
        }

        const p = updated[0];

        await writeAuditLog({
            organizationId,
            actorId: userId,
            projectId: p.id,
            action: "PROJECT_UPDATED",
            details: { projectName: p.name, description: p.description ?? "", status: p.status },
            ...metadata,
        });

        return await this.getProjectById(p.id, organizationId);
    }

    /**
     * Soft-deletes a project and records an audit log entry.
     */
    async deleteProject(
        projectId: string,
        organizationId: string,
        userId: string,
        metadata: RequestMetadata = {}
    ): Promise<{ id: string } | null> {
        const deleted = await db
            .update(project)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .returning();

        if (deleted.length === 0) {
            return null;
        }

        await writeAuditLog({
            organizationId,
            actorId: userId,
            projectId: deleted[0].id,
            action: "PROJECT_DELETED",
            details: { projectName: deleted[0].name, status: "DELETED" },
            ...metadata,
        });

        return { id: deleted[0].id };
    }
}

export const projectService = new ProjectService();
