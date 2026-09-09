import { AuditAction, AuditLogModel, IAuditLog } from "@/models/audit-log.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

export interface ActivityQueryOptions {
    page?: number;
    limit?: number;
    category?: "ALL" | "DOCUMENTS" | "VERIFICATION" | "TEAM" | "PROJECTS";
    action?: string;
    actorId?: string;
    search?: string;
    startDate?: string | Date;
    endDate?: string | Date;
}

export const CATEGORY_ACTIONS: Record<string, AuditAction[]> = {
    DOCUMENTS: [
        AuditAction.DOCUMENT_UPLOADED,
        AuditAction.DOCUMENT_TRANSFORMED,
        AuditAction.DOCUMENT_DELETED,
        AuditAction.DOCUMENT_STATUS_CHANGED,
        AuditAction.TEMPLATE_UPLOADED,
        AuditAction.TEMPLATE_PROCESSED,
    ],
    VERIFICATION: [
        AuditAction.DOCUMENT_VERIFIED,
        AuditAction.DOCUMENT_REJECTED,
        AuditAction.EXTRACTION_APPROVED,
        AuditAction.EXTRACTION_REJECTED,
    ],
    TEAM: [
        AuditAction.MEMBER_INVITED,
        AuditAction.MEMBER_ROLE_UPDATED,
        AuditAction.MEMBER_REMOVED,
        AuditAction.INVITE_REVOKED,
        AuditAction.INVITE_ACCEPTED,
    ],
    PROJECTS: [
        AuditAction.PROJECT_CREATED,
        AuditAction.PROJECT_UPDATED,
        AuditAction.PROJECT_DELETED,
    ],
};

class AuditLogRepository extends BaseRepository<IAuditLog> {
    constructor() {
        super(AuditLogModel);
    }

    async findByDocument(documentId: string) {
        return await this.model
            .find({ documentId: new mongoose.Types.ObjectId(documentId) })
            .sort({ createdAt: -1 })
            .populate("actorId", "firstName lastName email avatar");
    }

    async findActivitiesByOrg(organizationId: string, options: ActivityQueryOptions = {}) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 20));
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
        };

        // Filter by specific action if provided
        if (options.action && Object.values(AuditAction).includes(options.action as AuditAction)) {
            filter.action = options.action;
        } else if (options.category && options.category !== "ALL" && CATEGORY_ACTIONS[options.category]) {
            // Filter by category group
            filter.action = { $in: CATEGORY_ACTIONS[options.category] };
        }

        // Filter by specific actor
        if (options.actorId && mongoose.Types.ObjectId.isValid(options.actorId)) {
            filter.actorId = new mongoose.Types.ObjectId(options.actorId);
        }

        // Date range filter
        if (options.startDate || options.endDate) {
            filter.createdAt = {};
            if (options.startDate) filter.createdAt.$gte = new Date(options.startDate);
            if (options.endDate) filter.createdAt.$lte = new Date(options.endDate);
        }

        // Free-text search inside details (fileName, projectName, email, reason)
        if (options.search && options.search.trim()) {
            const searchRegex = new RegExp(options.search.trim(), "i");
            filter.$or = [
                { "details.fileName": searchRegex },
                { "details.originalFileName": searchRegex },
                { "details.projectName": searchRegex },
                { "details.targetEmail": searchRegex },
                { "details.reason": searchRegex },
            ];
        }

        const [activities, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("actorId", "firstName lastName email avatar")
                .populate("documentId", "originalFileName status sizeBytes")
                .populate("projectId", "name")
                .lean(),
            this.model.countDocuments(filter),
        ]);

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

    async getActivityStats(organizationId: string) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [total24h, verifications24h, uploads24h, teamUpdates24h, totalAllTime] = await Promise.all([
            // Total events in past 24 hours
            this.model.countDocuments({
                organizationId: orgObjectId,
                createdAt: { $gte: oneDayAgo },
            }),
            // Verifications & Rejections in past 24 hours
            this.model.countDocuments({
                organizationId: orgObjectId,
                action: { $in: [AuditAction.DOCUMENT_VERIFIED, AuditAction.DOCUMENT_REJECTED] },
                createdAt: { $gte: oneDayAgo },
            }),
            // Uploads in past 24 hours
            this.model.countDocuments({
                organizationId: orgObjectId,
                action: AuditAction.DOCUMENT_UPLOADED,
                createdAt: { $gte: oneDayAgo },
            }),
            // Team changes in past 24 hours
            this.model.countDocuments({
                organizationId: orgObjectId,
                action: {
                    $in: [
                        AuditAction.MEMBER_INVITED,
                        AuditAction.MEMBER_ROLE_UPDATED,
                        AuditAction.MEMBER_REMOVED,
                    ],
                },
                createdAt: { $gte: oneDayAgo },
            }),
            // Total events all-time
            this.model.countDocuments({
                organizationId: orgObjectId,
            }),
        ]);

        return {
            total24h,
            verifications24h,
            uploads24h,
            teamUpdates24h,
            totalAllTime,
        };
    }
}

const auditLogRepository = new AuditLogRepository();
export default auditLogRepository;