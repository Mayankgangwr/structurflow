import { ProjectModel, IProject } from "@/models/project.model";
import { DocumentModel, DocumentStatus } from "@/models/document.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

export interface ProjectQueryOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

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

    async findByOrg(organizationId: string, options: ProjectQueryOptions = {}) {
        const page = Math.max(1, Number(options.page) || 1);
        const limit = Math.max(1, Number(options.limit) || 10);
        const skip = (page - 1) * limit;
        const search = options.search?.trim();
        const status = options.status?.trim();
        const sortBy = options.sortBy || "lastActivity";
        const sortOrder = options.sortOrder === "asc" ? 1 : -1;

        const orgObjectId = new mongoose.Types.ObjectId(organizationId);

        // 1. Initial match on project fields
        const initialMatch: any = {
            organizationId: orgObjectId,
            isDeleted: { $ne: true }
        };

        if (search) {
            const searchRegex = new RegExp(search, "i");
            initialMatch.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        // 2. Build aggregation pipeline
        const pipeline: mongoose.PipelineStage[] = [
            { $match: initialMatch },
            ...documentStatsLookupStages,
        ];

        // 3. Post-lookup filter for computed status
        if (status && status !== "ALL") {
            if (status === "Needs Verification") {
                pipeline.push({ $match: { needsVerification: { $gt: 0 } } });
            } else if (status === "Processing") {
                pipeline.push({ $match: { processing: { $gt: 0 } } });
            } else if (status === "Active") {
                pipeline.push({ $match: { isDeleted: { $ne: true } } });
            } else if (status === "Inactive") {
                pipeline.push({ $match: { isDeleted: true } });
            }
        }

        // 4. Dynamic sorting
        const sortStage: Record<string, 1 | -1> = {};
        if (sortBy === "name") {
            sortStage.name = sortOrder;
        } else if (sortBy === "documents") {
            sortStage.documents = sortOrder;
        } else if (sortBy === "needsVerification") {
            sortStage.needsVerification = sortOrder;
        } else if (sortBy === "successRate") {
            sortStage.successRate = sortOrder;
        } else if (sortBy === "createdAt") {
            sortStage.createdAt = sortOrder;
        } else {
            // Default: lastActivity (maps to computed lastActivityDate)
            sortStage.lastActivityDate = sortOrder;
        }
        sortStage._id = -1; // Deterministic secondary sort

        pipeline.push(
            { $sort: sortStage },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        );

        // 5. Run aggregation and parallel counts
        const [aggregationResult, totalOrgProjects, totalPendingVerification] = await Promise.all([
            this.model.aggregate(pipeline),
            this.model.countDocuments({ organizationId: orgObjectId, isDeleted: { $ne: true } }),
            DocumentModel.countDocuments({
                organizationId: orgObjectId,
                status: { $in: [DocumentStatus.TRANSFORMED, "REVIEW_REQUIRED"] },
                isDeleted: { $ne: true }
            } as any)
        ]);

        const facetData = aggregationResult[0] || { data: [], totalCount: [] };
        const projects = facetData.data || [];
        const total = facetData.totalCount[0]?.count || 0;

        return {
            projects,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            totalProjects: totalOrgProjects,
            totalPendingVerification
        };
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
