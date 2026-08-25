import { ProjectModel, IProject } from "@/models/project.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

class ProjectRepository extends BaseRepository<IProject> {
    constructor() {
        super(ProjectModel);
    }

    async findByOrg(organizationId: string) {
        return await this.model.find({ organizationId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    }

    async findByIdAndOrg(projectId: string, organizationId: string) {
        return await this.model.findOne({ _id: projectId, organizationId, isDeleted: { $ne: true } });
    }

    async softDelete(projectId: string) {
        return await this.model.findByIdAndUpdate(
            projectId,
            { isDeleted: true },
            { new: true }
        );
    }

    async updateTemplate(projectId: string, templateDocumentId: mongoose.Types.ObjectId) {
        return await this.model.findByIdAndUpdate(
            projectId,
            { templateDocumentId },
            { new: true }
        );
    }
}

const projectRepository = new ProjectRepository();
export default projectRepository;
