import { db } from "@/lib/db";
import { auditLog, user, document, project } from "@/schema";
import { and, eq, gte, lte, inArray, desc, or, ilike, sql, count } from "drizzle-orm";
import { CATEGORY_ACTIONS, type GetActivityQueryInput } from "@/lib/validations/activity";

export class ActivityService {
    /**
     * Lists organization activities with filtering, pagination, search, and role-based IP sanitization.
     */
    async getActivities(
        organizationId: string,
        options: GetActivityQueryInput,
        userRole?: string
    ) {
        const {
            page = 1,
            limit = 20,
            category = "ALL",
            action,
            actorId,
            search,
            startDate,
            endDate,
        } = options;

        const offset = (page - 1) * limit;

        const conditions = [eq(auditLog.organizationId, organizationId)];

        // Filter by specific action or category group
        if (action && action !== "ALL") {
            conditions.push(eq(auditLog.action, action));
        } else if (category && category !== "ALL" && CATEGORY_ACTIONS[category]) {
            conditions.push(inArray(auditLog.action, CATEGORY_ACTIONS[category]));
        }

        // Filter by specific actor
        if (actorId && actorId.trim()) {
            conditions.push(eq(auditLog.actorId, actorId.trim()));
        }

        // Date range filters
        if (startDate) {
            conditions.push(gte(auditLog.createdAt, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(auditLog.createdAt, new Date(endDate)));
        }

        // Free-text search across JSON details and joined entities
        if (search && search.trim()) {
            const searchPattern = `%${search.trim()}%`;
            conditions.push(
                or(
                    sql`${auditLog.details}::text ILIKE ${searchPattern}`,
                    ilike(user.name, searchPattern),
                    ilike(user.email, searchPattern),
                    ilike(document.originalFilename, searchPattern),
                    ilike(project.name, searchPattern)
                )!
            );
        }

        const whereClause = and(...conditions);

        // Get total count
        const totalResult = await db
            .select({ count: count() })
            .from(auditLog)
            .leftJoin(user, eq(auditLog.actorId, user.id))
            .leftJoin(document, eq(auditLog.documentId, document.id))
            .leftJoin(project, eq(auditLog.projectId, project.id))
            .where(whereClause);

        const total = Number(totalResult[0]?.count || 0);

        // Fetch paginated activities with joined relations
        const rows = await db
            .select({
                id: auditLog.id,
                organizationId: auditLog.organizationId,
                actorId: auditLog.actorId,
                projectId: auditLog.projectId,
                documentId: auditLog.documentId,
                action: auditLog.action,
                details: auditLog.details,
                ipAddress: auditLog.ipAddress,
                userAgent: auditLog.userAgent,
                createdAt: auditLog.createdAt,
                actor: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.image,
                },
                document: {
                    id: document.id,
                    originalFileName: document.originalFilename,
                    status: document.status,
                    sizeBytes: document.sizeBytes,
                },
                project: {
                    id: project.id,
                    name: project.name,
                },
            })
            .from(auditLog)
            .leftJoin(user, eq(auditLog.actorId, user.id))
            .leftJoin(document, eq(auditLog.documentId, document.id))
            .leftJoin(project, eq(auditLog.projectId, project.id))
            .where(whereClause)
            .orderBy(desc(auditLog.createdAt))
            .limit(limit)
            .offset(offset);

        // Sensitive networking info (like IP address) is restricted to OWNER and ADMIN
        const isPrivileged = userRole
            ? ["OWNER", "ADMIN"].includes(userRole.toUpperCase())
            : false;

        const activities = rows.map((row) => ({
            _id: row.id,
            id: row.id,
            organizationId: row.organizationId,
            actorId: row.actor?.id
                ? {
                      _id: row.actor.id,
                      id: row.actor.id,
                      firstName: row.actor.firstName || undefined,
                      lastName: row.actor.lastName || undefined,
                      email: row.actor.email || undefined,
                      avatar: row.actor.avatar || null,
                  }
                : null,
            documentId: row.document?.id
                ? {
                      _id: row.document.id,
                      id: row.document.id,
                      originalFileName: row.document.originalFileName,
                      status: row.document.status,
                      sizeBytes: row.document.sizeBytes,
                  }
                : null,
            projectId: row.project?.id
                ? {
                      _id: row.project.id,
                      id: row.project.id,
                      name: row.project.name,
                  }
                : null,
            action: row.action,
            details: (row.details as Record<string, any>) || {},
            ...(isPrivileged && row.ipAddress ? { ipAddress: row.ipAddress } : {}),
            userAgent: row.userAgent || undefined,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.createdAt.toISOString(),
        }));

        return {
            activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    /**
     * Aggregates activity statistics for the past 24 hours and total all-time.
     */
    async getActivityStats(organizationId: string) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [stats] = await db
            .select({
                total24h: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.createdAt} >= ${oneDayAgo}), 0)::int`,
                verifications24h: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.createdAt} >= ${oneDayAgo} AND ${inArray(auditLog.action, CATEGORY_ACTIONS.VERIFICATION)}), 0)::int`,
                uploads24h: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.createdAt} >= ${oneDayAgo} AND ${inArray(auditLog.action, ["DOCUMENT_UPLOADED", "TEMPLATE_UPLOADED"])}), 0)::int`,
                teamUpdates24h: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.createdAt} >= ${oneDayAgo} AND ${inArray(auditLog.action, CATEGORY_ACTIONS.TEAM)}), 0)::int`,
                totalAllTime: sql<number>`COUNT(*)::int`,
            })
            .from(auditLog)
            .where(eq(auditLog.organizationId, organizationId));

        return {
            total24h: stats?.total24h ?? 0,
            verifications24h: stats?.verifications24h ?? 0,
            uploads24h: stats?.uploads24h ?? 0,
            teamUpdates24h: stats?.teamUpdates24h ?? 0,
            totalAllTime: stats?.totalAllTime ?? 0,
        };
    }
}

export const activityService = new ActivityService();
