import { DocumentModel, IDocument } from "@/models/document.model"
import BaseRepository from "./base.repository";

class DocumentRepository extends BaseRepository<IDocument> {
    constructor() {
        super(DocumentModel);
    }

    async findByIdAndOrg(documentId: string, organizationId: string) {
        return await this.model.findOne({ _id: documentId, organizationId: organizationId, isDeleted: { $ne: true } })
    }

    async findAllByOrg(organizationId: string, limit: number = 50, skip: number = 0) {
        return await this.model.find({ organizationId, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit)
            .populate('uploadedById', 'firstName lastName email');
    }

    async countByOrgAndHash(organizationId: string, fileHash: string) {
        return this.model.countDocuments({ organizationId, fileHash, isDeleted: { $ne: true } })
    }

    async findByProjectAndType(projectId: string, documentType: string) {
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