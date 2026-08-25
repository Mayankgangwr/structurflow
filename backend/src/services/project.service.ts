import projectRepository from "@/repositories/project.repository";
import { ApiErrors } from "@/utils/errors";
import mongoose from "mongoose";

class ProjectService {
    async createProject(name: string, description: string | undefined, organizationId: string, userId: string) {
        const project = await projectRepository.create({
            name,
            description,
            organizationId: new mongoose.Types.ObjectId(organizationId),
            createdById: new mongoose.Types.ObjectId(userId)
        });
        return project;
    }

    async getProjectsByOrg(organizationId: string) {
        return await projectRepository.findByOrg(organizationId);
    }

    async getById(id: string) {
        const project = await projectRepository.findById(id);
        if (!project) throw ApiErrors.projectNotFound();
        return project;
    }

    async updateById(id: string, name: string, description: string) {
        const project = await projectRepository.updateById(id, { name, description });
        if (!project) throw ApiErrors.projectNotFound();
        return project;
    }

    async deleteProject(id: string) {
        const project = await projectRepository.softDelete(id);
        if (!project) throw ApiErrors.projectNotFound();
        return project;
    }
}

const projectService = new ProjectService();
export default projectService;
