import { db } from "@/lib/db";
import { document, project, auditLog, user } from "@/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { analyticsService } from "@/lib/services/analytics.service";
import type {
    DashboardQueryInput,
    DashboardDataResponse,
    DashboardRecentDocument,
    DashboardActivityItem,
    DashboardPipelineCounts,
} from "@/lib/validations/dashboard";

export class DashboardService {
    /**
     * Aggregates all Mission Control command center telemetry concurrently
     */
    async getMissionControlDashboard(
        organizationId: string,
        options: DashboardQueryInput = {}
    ): Promise<DashboardDataResponse> {
        const period = options.period ?? "7d";
        const recentLimit = options.recentLimit ?? 6;
        const activityLimit = options.activityLimit ?? 5;

        // Run all queries concurrently for ultra-fast response times
        const [
            overview,
            statusDistResult,
            pipelineCountsRaw,
            recentDocsRaw,
            projectCountResult,
            recentActivitiesRaw,
        ] = await Promise.all([
            // 1. Overview KPIs and trend deltas
            analyticsService.getOverviewMetrics(organizationId, {
                period,
                projectId: options.projectId,
            }),

            // 2. Status distribution breakdown
            analyticsService.getStatusDistribution(organizationId, {
                period,
                projectId: options.projectId,
            }),

            // 3. Pipeline stage counts directly from documents table
            db
                .select({
                    status: document.status,
                    count: count(),
                })
                .from(document)
                .where(
                    and(
                        eq(document.organizationId, organizationId),
                        eq(document.isDeleted, false),
                        options.projectId ? eq(document.projectId, options.projectId) : undefined
                    )
                )
                .groupBy(document.status),

            // 4. Recent documents with joined project name
            db
                .select({
                    doc: document,
                    projectName: project.name,
                })
                .from(document)
                .leftJoin(project, eq(document.projectId, project.id))
                .where(
                    and(
                        eq(document.organizationId, organizationId),
                        eq(document.isDeleted, false),
                        options.projectId ? eq(document.projectId, options.projectId) : undefined
                    )
                )
                .orderBy(desc(document.createdAt))
                .limit(recentLimit),

            // 5. Total active projects count
            db
                .select({ count: count() })
                .from(project)
                .where(
                    and(
                        eq(project.organizationId, organizationId),
                        eq(project.isDeleted, false)
                    )
                ),

            // 6. Recent audit activities with joined actor and project info
            db
                .select({
                    log: auditLog,
                    actorName: user.name,
                    actorEmail: user.email,
                    projectName: project.name,
                })
                .from(auditLog)
                .leftJoin(user, eq(auditLog.actorId, user.id))
                .leftJoin(project, eq(auditLog.projectId, project.id))
                .where(eq(auditLog.organizationId, organizationId))
                .orderBy(desc(auditLog.createdAt))
                .limit(activityLimit),
        ]);

        // Process pipeline stage counts
        const countMap: Record<string, number> = {};
        pipelineCountsRaw.forEach((row) => {
            countMap[row.status] = Number(row.count);
        });

        const pipelineCounts: DashboardPipelineCounts = {
            uploaded: countMap["UPLOADED"] ?? 0,
            processing: (countMap["PROCESSING"] ?? 0) + (countMap["TRANSFORMED"] ?? 0),
            needsVerification: (countMap["REVIEW_REQUIRED"] ?? 0) + (countMap["TRANSFORMED"] ?? 0),
            verified: (countMap["VERIFIED"] ?? 0) + (countMap["COMPLETED"] ?? 0),
            exported: countMap["EXPORTED"] ?? 0,
        };

        // Format recent documents
        const recentDocuments: DashboardRecentDocument[] = recentDocsRaw.map(({ doc, projectName }) => ({
            id: doc.id,
            _id: doc.id,
            originalFilename: doc.originalFilename,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes,
            secureUrl: doc.secureUrl,
            status: doc.status,
            processingDetails: doc.processingDetails,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
            updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
            projectId: doc.projectId
                ? {
                      _id: doc.projectId,
                      id: doc.projectId,
                      name: projectName || "Untitled Project",
                  }
                : null,
        }));

        // Identify the top priority document waiting for verification
        const topPendingDocument =
            recentDocuments.find(
                (d) => d.status === "TRANSFORMED" || d.status === "REVIEW_REQUIRED"
            ) || null;

        const totalProjects = Number(projectCountResult[0]?.count ?? 0);

        // Format recent audit activities
        const recentActivities: DashboardActivityItem[] = recentActivitiesRaw.map(
            ({ log, actorName, actorEmail, projectName }) => ({
                id: log.id,
                action: log.action,
                organizationId: log.organizationId,
                actorId: log.actorId,
                actorName: actorName || actorEmail?.split("@")[0] || "System Actor",
                actorEmail: actorEmail || undefined,
                projectId: log.projectId,
                projectName: projectName || undefined,
                documentId: log.documentId,
                documentFilename: (log.details as any)?.filename || undefined,
                details: (log.details as Record<string, any>) || {},
                createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
            })
        );

        return {
            overview,
            pipelineCounts,
            recentDocuments,
            topPendingDocument,
            totalProjects,
            recentActivities,
            statusDistribution: statusDistResult.distribution,
        };
    }
}

export const dashboardService = new DashboardService();
