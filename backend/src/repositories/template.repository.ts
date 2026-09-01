import { ITemplate, TemplateModel } from "@/models/template.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";
import { ApiErrors } from "@/utils/errors";

class TemplateRepository extends BaseRepository<ITemplate> {
    constructor() {
        super(TemplateModel)
    }

    async findByIdAndOrg(id: string, organizationId: string) {
        return await this.model.findOne({ _id: id, organizationId: organizationId, isDeleted: { $ne: true } })
    }

    async findAllByProject(projectId: string, organizationId: string, limit: number = 50, skip: number = 0) {
        let query = { projectId: new mongoose.Types.ObjectId(projectId), organizationId, isDeleted: { $ne: true } };

        const [documents, total] = await Promise.all([
            this.model.find(query).sort({ createdAt: -1 }).skip(skip)
                .limit(limit).populate('uploadedById', 'firstName lastName email'),
            this.model.countDocuments(query)
        ]);

        return { documents, total };
    }

    async activeTemplateByProject(projectId: string, organizationId: string) {
        const activeTemplate = await this.model.findOne({ projectId, organizationId, isDeleted: { $ne: true }, isActive: true });
        return activeTemplate;
    }

    async templateDetails(id: string, organizationId: string) {
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(organizationId)) {
            throw ApiErrors.invalidTemplateOrOrgId();
        }

        const [template] = await this.model.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    isDeleted: false,
                },
            },
        ]);

        if (!template) {
            throw new Error("Template not found");
        }

        return template;
    }

    async templateDelete(id: string, organizationId: string) {
        return await this.model.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: { isDeleted: true } },
            { new: true }
        );
    }

    async countByOrgAndHash(organizationId: string, fileHash: string) {
        return this.model.countDocuments({ organizationId, fileHash, isDeleted: { $ne: true } })
    }
}

const templateRepository = new TemplateRepository();

export default templateRepository;