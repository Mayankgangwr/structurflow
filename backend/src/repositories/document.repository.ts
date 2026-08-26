import { DocumentModel, IDocument } from "@/models/document.model"
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

class DocumentRepository extends BaseRepository<IDocument> {
    constructor() {
        super(DocumentModel);
    }

    async findByIdAndOrg(documentId: string, organizationId: string) {
        return await this.model.findOne({ _id: documentId, organizationId: organizationId, isDeleted: { $ne: true } })
    }

    async findAllByProject(projectId: string, limit: number = 50, skip: number = 0, docType: 'TEMPLATE' | 'DOC' = "DOC") {
        let query: any;
        if (docType === "DOC") {
            query = { projectId: new mongoose.Types.ObjectId(projectId), documentType: { $ne: 'TEMPLATE' }, isDeleted: { $ne: true } };
        } else {
            query = { projectId: new mongoose.Types.ObjectId(projectId), documentType: 'TEMPLATE', isDeleted: { $ne: true } };
        }

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
        return this.model.countDocuments({ organizationId, fileHash, isDeleted: { $ne: true } })
    }

    async findByProjectAndType(projectId: string, documentType: 'TEMPLATE' | 'RAW' | 'TRANSFORMED') {
        return await this.model.find({ projectId, documentType, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .populate('uploadedById', 'firstName lastName email');
    }

    async softDeleteById(documentId: string) {
        return await this.model.findByIdAndUpdate(documentId, { isDeleted: true }, { new: true });
    }

    async getSummaryByProject(projectId: string) {
        const stats = await this.model.aggregate([
            {
                $match: {
                    projectId: new mongoose.Types.ObjectId(projectId),
                    documentType: { $ne: 'TEMPLATE' },
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
}

const documentRepository = new DocumentRepository();
export default documentRepository;