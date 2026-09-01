import { DocumentModel, IDocument } from "@/models/document.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

class DocumentRepository extends BaseRepository<IDocument> {
    constructor() {
        super(DocumentModel);
    }

    async findByIdAndOrg(documentId: string, organizationId: string) {
        return this.model.findOne({
            _id: documentId,
            organizationId,
            isDeleted: { $ne: true }
        });
    }

    async findAllByProject(projectId: string, limit = 50, skip = 0) {
        const query = {
            projectId: new mongoose.Types.ObjectId(projectId),
            isDeleted: { $ne: true }
        };

        const [documents, total] = await Promise.all([
            this.model.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('uploadedById', 'firstName lastName email'),
            this.model.countDocuments(query)
        ]);

        return { documents, total };
    }

    async countByOrgAndHash(organizationId: string, fileHash: string) {
        return this.model.countDocuments({
            organizationId,
            fileHash,
            isDeleted: { $ne: true }
        });
    }

    async softDeleteById(documentId: string) {
        return this.model.findByIdAndUpdate(
            documentId,
            { isDeleted: true },
            { new: true }
        );
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

        const summary: Record<string, number> = {
            TOTAL: 0,
            UPLOADED: 0,
            PROCESSING: 0,
            EXTRACTED: 0,
            MAPPING: 0,
            VALIDATING: 0,
            REVIEW_REQUIRED: 0,
            TRUSTED: 0,
            COMPLETED: 0,
            FAILED: 0
        };

        stats.forEach(stat => {
            if (stat._id in summary) {
                summary[stat._id as string] = stat.count;
            }
            summary.TOTAL += stat.count;
        });

        return summary;
    }
}

const documentRepository = new DocumentRepository();
export default documentRepository;
