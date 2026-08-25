import React, { useState } from "react";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { Folder, TriangleAlert, MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProjectForm from "./ProjectForm";
import DeleteConformationDialog from "./DeleteConformationDialog";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Project, useDeleteProjectMutation } from "../projectApi";
import { useRouter } from "next/navigation";

export interface IProjectItems {
    projects: Project[];
}

const ProjectItems: React.FC<IProjectItems> = ({ projects }) => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalProjects = projects.length;
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const { activeOrganizationId } = useSelector((state: RootState) => state.auth);

    const [deleteProject, { isLoading }] = useDeleteProjectMutation();
    const paginatedProjects = projects.slice((page - 1) * pageSize, page * pageSize);

    const totalPages = Math.ceil(totalProjects / pageSize);

    const startItem = (page - 1) * pageSize + 1;

    const endItem = Math.min(page * pageSize, totalProjects);

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        setIsProjectFormOpen(true);
    };

    const handleOpenDeleteDialog = (projectId: string) => {
        setIsDeleteDialogVisible(true);
        setCurrentProject(projects.find((p) => p.id === projectId) || null);
    }

    const handleDelete = async (projectId: string) => {
        await deleteProject(projectId).unwrap();
        setIsDeleteDialogVisible(false);
        setCurrentProject(null);
    }

    const handleClose = () => {
        setIsProjectFormOpen(false);
        setIsDeleteDialogVisible(false);
        setCurrentProject(null);
    };

    const projectColumns: DataTableColumn<Project>[] = [
        {
            id: "project",
            header: "Project",
            cell: (project: Project) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Folder className="w-4 h-4" />
                    </div>
                    <div className="max-w-60">
                        <p className="font-semibold text-[12px] text-text-primary truncate">{project.name}
                            <span className="ms-1 text-secondary font-normal text-[13px]">({project.documents.toLocaleString()})</span>
                        </p>
                        <p className="text-secondary text-[12px] truncate">{project.description}</p>
                    </div>
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: (project) => (
                <span className={cn("px-2 py-1 bg-surface-container-high rounded-full font-label-sm text-[11px] font-semibold tracking-wide border border-border-subtle",
                    project.status === "Active" ? "bg-primary/10 text-primary "
                        : "text-secondary"
                )}>
                    {project.status}
                </span>
            ),
        },
        {
            id: "verification",
            header: "Needs Verification",
            className: "text-center",
            cell: (project) => project.needsVerification > 0 ? (
                <span className="px-2 py-1 bg-error-container text-error rounded-full font-label-sm font-normal inline-flex items-center gap-1">
                    <TriangleAlert className="w-4 h-4" /> {project.needsVerification}
                </span>
            ) : (
                <span>{project.needsVerification}</span>
            ),
        },
        {
            id: "successRate",
            header: "Success Rate",
            cell: (project) => (
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-border-subtle overflow-hidden">
                        <div
                            className="h-1.5 rounded-full bg-tertiary-container"
                            style={{
                                width: `${project.successRate}%`,
                            }}
                        />
                    </div>
                    <span className="text-[12px] text-secondary font-medium">
                        {project.successRate}%
                    </span>
                </div>
            ),
        },
        {
            id: "lastActivity",
            header: "Last Activity",

            cell: (project) => (
                <span className="text-secondary">
                    {project.lastActivity}
                </span>
            ),
        },

        {
            id: "actions",
            header: "Actions",
            headerClassName: "text-right",
            className: "text-right",
            cell: (project) => (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-secondary transition-colors hover:text-text-primary hover:bg-surface-container-low rounded-md sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 outline-none"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 font-body-sm text-body-sm bg-surface border-border-subtle z-50">
                        <DropdownMenuItem
                            className="cursor-pointer hover:bg-surface-container-low text-text-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/project/${project.id}`);
                            }}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer hover:bg-surface-container-low text-text-primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(project)
                            }}
                        >
                            <Edit2 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-error hover:bg-error/10 hover:text-error focus:bg-error/10 focus:text-error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(project.id);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];



    return (
        <>
            <div className="">
                <DataTable
                    data={paginatedProjects}
                    columns={projectColumns}
                    getRowId={(project: Project) => project.id}
                    isLoading={false}
                    emptyMessage="No projects found."
                />
                <DataTablePagination
                    page={page}
                    pageSize={pageSize}
                    total={totalProjects}
                    totalPages={totalPages}
                    startItem={startItem}
                    endItem={endItem}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />

            </div>

            {currentProject && isDeleteDialogVisible && (
                <DeleteConformationDialog
                    isOpen={isDeleteDialogVisible}
                    onClose={() => handleClose()}
                    project={currentProject}
                    onDelete={handleDelete}
                />
            )}
            {currentProject && isProjectFormOpen && (
                <ProjectForm
                    isOpen={isProjectFormOpen}
                    onClose={() => handleClose()}
                    project={currentProject}
                />
            )}

        </>
    )
}
export default ProjectItems