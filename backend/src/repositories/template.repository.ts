import { TemplateModel, ITemplate } from "@/models/template.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

class TemplateRepository extends BaseRepository<ITemplate> {
    constructor() {
        super(TemplateModel);
    }

    async findByIdAndOrg(templateId: string, organizationId: string) {
        return this.model.findOne({
            _id: templateId,
            organizationId,
            isDeleted: { $ne: true }
        });
    }

    async findByProject(projectId: string) {
        return this.model.find({
            projectId: new mongoose.Types.ObjectId(projectId),
            isDeleted: { $ne: true }
        })
        .sort({ createdAt: -1 })
        .populate('uploadedById', 'firstName lastName email');
    }

    async findActiveByProject(projectId: string) {
        return this.model.findOne({
            projectId: new mongoose.Types.ObjectId(projectId),
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 });
    }

    async findByOrg(organizationId: string, limit = 50, skip = 0) {
        return this.model.find({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            isDeleted: { $ne: true }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedById', 'firstName lastName email');
    }

    async softDeleteById(templateId: string) {
        return this.model.findByIdAndUpdate(
            templateId,
            { isDeleted: true },
            { new: true }
        );
    }

    async countByOrgAndHash(organizationId: string, fileHash: string) {
        return this.model.countDocuments({
            organizationId,
            fileHash,
            isDeleted: { $ne: true }
        });
    }
}

const templateRepository = new TemplateRepository();
export default templateRepository;
