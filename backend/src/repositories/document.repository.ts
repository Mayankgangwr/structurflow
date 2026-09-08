import { DocumentModel, IDocument, DocumentStatus } from "@/models/document.model"
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

export interface DocumentQueryOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

class DocumentRepository extends BaseRepository<IDocument> {
    constructor() {
        super(DocumentModel);
    }

    async findByIdAndOrg(documentId: string, organizationId: string) {
        return await this.model.findOne({ _id: documentId, organizationId: organizationId, isDeleted: { $ne: true } })
    }

    async findAllByProject(
        projectId: string,
        optionsOrLimit: DocumentQueryOptions | number = 50,
        skipArg: number = 0
    ) {
        let options: DocumentQueryOptions;
        if (typeof optionsOrLimit === 'number') {
            const limit = optionsOrLimit;
            const page = Math.floor(skipArg / limit) + 1;
            options = { page, limit };
        } else {
            options = optionsOrLimit || {};
        }

        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, options.limit || 10);
        const skip = (page - 1) * limit;

        const query: any = {
            projectId: new mongoose.Types.ObjectId(projectId),
            isDeleted: { $ne: true }
        };

        // 1. Search Filter (originalFileName or originalFilename)
        if (options.search && options.search.trim()) {
            const regex = { $regex: options.search.trim(), $options: 'i' };
            query.$or = [
                { originalFileName: regex },
                { originalFilename: regex }
            ];
        }

        // 2. Status Filter
        if (options.status && options.status !== 'ALL') {
            if (options.status === 'NEEDS_VERIFICATION' || options.status === 'PENDING') {
                query.status = { $in: [DocumentStatus.TRANSFORMED, 'REVIEW_REQUIRED'] };
            } else {
                query.status = options.status;
            }
        }

        // 3. Sorting
        let sortField = 'createdAt';
        if (options.sortBy === 'name') {
            sortField = 'originalFileName';
        } else if (options.sortBy === 'size') {
            sortField = 'sizeBytes';
        } else if (options.sortBy === 'status') {
            sortField = 'status';
        } else if (options.sortBy === 'createdAt') {
            sortField = 'createdAt';
        }

        const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
        const sortOptions: any = { [sortField]: sortDirection };
        if (sortField !== '_id') {
            sortOptions._id = -1; // tie breaker
        }

        const [documents, total] = await Promise.all([
            this.model.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('uploadedById', 'firstName lastName email'),
            this.model.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            documents,
            total,
            page,
            limit,
            totalPages
        };
    }

    async countByOrgAndHash(organizationId: string, fileHash: string) {
        return this.model.countDocuments({ organizationId, fileHash, isDeleted: { $ne: true } })
    }

    async softDeleteById(documentId: string) {
        return await this.model.findByIdAndUpdate(documentId, { isDeleted: true }, { new: true });
    }

    async getSummaryByProject(projectId: string) {
        const stats = await this.model.aggregate([
            {
                $match: {
                    projectId: new mongoose.Types.ObjectId(projectId),
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            TOTAL: 0,
            UPLOADED: 0,
            TRANSFORMED: 0,
            VERIFIED: 0,
            REJECTED: 0,
            EXPORTED: 0
        };

        stats.forEach(stat => {
            if (stat._id in summary) {
                summary[stat._id as keyof typeof summary] = stat.count;
            }
            summary.TOTAL += stat.count;
        });

        return summary;
    }

    async getOrganizationDocumentStats(organizationId: string) {
        const stats = await this.model.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    isDeleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            total: 0,
            uploaded: 0,
            processing: 0,
            transformed: 0,
            verified: 0,
            needsVerification: 0,
            exported: 0,
            failed: 0
        };

        stats.forEach((stat: any) => {
            const count = stat.count || 0;
            summary.total += count;
            if (stat._id === 'UPLOADED') summary.uploaded += count;
            if (stat._id === 'PROCESSING') summary.processing += count;
            if (stat._id === 'TRANSFORMED') {
                summary.transformed += count;
                summary.needsVerification += count;
            }
            if (stat._id === 'REVIEW_REQUIRED') {
                summary.needsVerification += count;
            }
            if (stat._id === 'VERIFIED') {
                summary.verified += count;
                summary.exported += count;
            }
            if (stat._id === 'EXPORTED') {
                summary.exported += count;
            }
            if (stat._id === 'FAILED' || stat._id === 'REJECTED') {
                summary.failed += count;
            }
        });

        return summary;
    }

    async findAllByOrganization(organizationId: string, options: DocumentQueryOptions = {}) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, options.limit || 10);
        const skip = (page - 1) * limit;

        const query: any = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            isDeleted: { $ne: true }
        };

        // Optional project filter
        if (options.projectId) {
            query.projectId = new mongoose.Types.ObjectId(options.projectId);
        }

        // 1. Search Filter (originalFileName or originalFilename)
        if (options.search && options.search.trim()) {
            const regex = { $regex: options.search.trim(), $options: 'i' };
            query.$or = [
                { originalFileName: regex },
                { originalFilename: regex }
            ];
        }

        // 2. Status Filter
        if (options.status && options.status !== 'ALL') {
            if (options.status === 'NEEDS_VERIFICATION' || options.status === 'PENDING') {
                query.status = { $in: [DocumentStatus.TRANSFORMED, 'REVIEW_REQUIRED'] };
            } else {
                query.status = options.status;
            }
        }

        // 3. Sorting
        let sortField = 'createdAt';
        if (options.sortBy === 'name') {
            sortField = 'originalFileName';
        } else if (options.sortBy === 'size') {
            sortField = 'sizeBytes';
        } else if (options.sortBy === 'status') {
            sortField = 'status';
        } else if (options.sortBy === 'createdAt') {
            sortField = 'createdAt';
        }

        const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
        const sortOptions: any = { [sortField]: sortDirection };
        if (sortField !== '_id') {
            sortOptions._id = -1; // tie breaker
        }

        const [documents, total, stats] = await Promise.all([
            this.model.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('projectId', 'name')
                .populate('uploadedById', 'firstName lastName email'),
            this.model.countDocuments(query),
            this.getOrganizationDocumentStats(organizationId)
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            documents,
            total,
            page,
            limit,
            totalPages,
            stats
        };
    }
}

const documentRepository = new DocumentRepository();
export default documentRepository;