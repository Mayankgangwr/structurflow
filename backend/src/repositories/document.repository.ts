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
        if (docType === "DOC") {
            return await this.model.find({ projectId: new mongoose.Types.ObjectId(projectId), documentType: { $ne: 'TEMPLATE' }, isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .skip(skip).limit(limit)
                .populate('uploadedById', 'firstName lastName email');
        } else {
            return await this.model.find({ projectId: new mongoose.Types.ObjectId(projectId), documentType: 'TEMPLATE', isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .skip(skip).limit(limit)
                .populate('uploadedById', 'firstName lastName email')
        }
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
}

const documentRepository = new DocumentRepository();
export default documentRepository;