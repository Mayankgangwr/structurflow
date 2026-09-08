import { ProjectModel, IProject } from "@/models/project.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

const documentStatsLookupStages: mongoose.PipelineStage[] = [
    {
        $lookup: {
            from: "documents",
            let: { projectId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$projectId", "$$projectId"] },
                                { $ne: ["$isDeleted", true] }
                            ]
                        }
                    }
                }
            ],
            as: "docs"
        }
    },
    {
        $addFields: {
            documents: { $size: "$docs" },
            needsVerification: {
                $size: {
                    $filter: {
                        input: "$docs",
                        as: "d",
                        cond: { $in: ["$$d.status", ["TRANSFORMED", "REVIEW_REQUIRED"]] }
                    }
                }
            },
            processing: {
                $size: {
                    $filter: {
                        input: "$docs",
                        as: "d",
                        cond: { $in: ["$$d.status", ["UPLOADED", "PROCESSING"]] }
                    }
                }
            },
            verifiedCount: {
                $size: {
                    $filter: {
                        input: "$docs",
                        as: "d",
                        cond: { $in: ["$$d.status", ["VERIFIED", "EXPORTED", "TRUSTED"]] }
                    }
                }
            },
            latestDocActivity: { $max: "$docs.updatedAt" }
        }
    },
    {
        $addFields: {
            successRate: {
                $cond: [
                    { $gt: ["$documents", 0] },
                    {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$verifiedCount", "$documents"] },
                                    100
                                ]
                            },
                            0
                        ]
                    },
                    0
                ]
            },
            lastActivityDate: {
                $cond: [
                    {
                        $and: [
                            { $ne: ["$latestDocActivity", null] },
                            { $gt: ["$latestDocActivity", "$updatedAt"] }
                        ]
                    },
                    "$latestDocActivity",
                    "$updatedAt"
                ]
            }
        }
    },
    {
        $project: {
            docs: 0,
            verifiedCount: 0,
            latestDocActivity: 0
        }
    }
];

class ProjectRepository extends BaseRepository<IProject> {
    constructor() {
        super(ProjectModel);
    }

    async findByOrg(organizationId: string) {
        return await this.model.aggregate([
            {
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    isDeleted: { $ne: true }
                }
            },
            { $sort: { createdAt: -1 } },
            ...documentStatsLookupStages
        ]);
    }

    async findByIdAndOrg(projectId: string, organizationId: string) {
        return await this.model.findOne({ _id: projectId, organizationId, isDeleted: { $ne: true } });
    }

    async findByIdWithTemplate(projectId: string) {
        const results = await this.model.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(projectId),
                    isDeleted: { $ne: true }
                }
            },
            {
                $lookup: {
                    from: "templates",
                    localField: "templateDocumentId",
                    foreignField: "_id",
                    as: "templateData"
                }
            },
            {
                $unwind: {
                    path: "$templateData",
                    preserveNullAndEmptyArrays: true
                }
            },
            ...documentStatsLookupStages
        ]);

        return results[0] || null;
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
