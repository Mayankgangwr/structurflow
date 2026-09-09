"use client";

import React, { useState, useEffect } from "react";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import {
    Folder,
    TriangleAlert,
    Edit2,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import ProjectForm from "./ProjectForm";
import DeleteConformationDialog from "./DeleteConformationDialog";
import ProjectCard from "./ProjectCard";
import ProjectToolbar from "./ProjectToolbar";
import EmptyStateSection from "./EmptyStateSection";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Project, useDeleteProjectMutation, useGetProjectsQuery } from "../projectApi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface IProjectItems {
    projects?: Project[];
}

const ProjectItems: React.FC<IProjectItems> = () => {
    const router = useRouter();
    const { can } = usePermissions();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState<"lastActivity" | "name" | "documents" | "needsVerification" | "successRate">("lastActivity");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const { activeOrganizationId } = useSelector((state: RootState) => state.auth);

    // Default to grid view on mobile devices
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            setViewMode("grid");
        }
    }, []);

    // Debounce search query by 300ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Fetch projects with server-side query params
    const { data: projectsData, isLoading, isFetching, isError, refetch } = useGetProjectsQuery(
        {
            page,
            limit: pageSize,
            search: debouncedSearchQuery,
            status: statusFilter,
            sortBy,
            sortOrder
        },
        { skip: !activeOrganizationId }
    );

    const [deleteProject] = useDeleteProjectMutation();

    const handleSort = (field: "lastActivity" | "name" | "documents" | "needsVerification" | "successRate") => {
        if (sortBy === field) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder(field === "name" ? "asc" : "desc");
        }
        setPage(1);
    };

    const projects = projectsData?.data?.projects || [];
    const pagination = projectsData?.data?.pagination;
    const meta = projectsData?.data?.meta;

    const totalProjects = pagination?.total ?? 0;
    const totalPages = pagination?.totalPages ?? 1;
    const startItem = totalProjects === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalProjects);

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        setIsProjectFormOpen(true);
    };

    const handleOpenDeleteDialog = (projectId: string) => {
        setIsDeleteDialogVisible(true);
        setCurrentProject(projects.find((p) => p.id === projectId) || null);
    };

    const handleDelete = async (projectId: string) => {
        await deleteProject(projectId).unwrap();
        setIsDeleteDialogVisible(false);
        setCurrentProject(null);
    };

    const handleClose = () => {
        setIsProjectFormOpen(false);
        setIsDeleteDialogVisible(false);
        setCurrentProject(null);
    };

    const projectColumns: DataTableColumn<Project>[] = [
        {
            id: "name",
            header: "Project",
            cell: (project) => (
                <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low p-1" onClick={() => router.push(`/project/${project.id}`)}>
                    <div
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Folder className="w-4 h-4" />
                    </div>
                    <div className="max-w-60">
                        <p className="font-semibold text-[12px] text-text-primary truncate hover:underline hover:text-primary ">{project.name}
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
        ...(can("edit_project") || can("delete_project")
            ? [
                  {
                      id: "actions",
                      header: "Actions",
                      headerClassName: "text-right",
                      className: "text-right",
                      cell: (project: Project) => (
                          <div className="flex items-center justify-end gap-2 px">
                              {can("delete_project") && (
                                  <Button
                                      variant="outline"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDeleteDialog(project.id);
                                      }}
                                      className="text-error hover:text-error transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                      size={"icon-sm"}
                                  >
                                      <Trash2 className="h-5 w-5 text-error/70 hover:text-error" />
                                  </Button>
                              )}
                              {can("edit_project") && (
                                  <Button
                                      variant="outline"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(project);
                                      }}
                                      className="text-primary/70 hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                      size={"icon-sm"}
                                  >
                                      <Edit2 className="h-5 w-5" />
                                  </Button>
                              )}
                          </div>
                      ),
                  } as DataTableColumn<Project>,
              ]
            : []),
    ];

    if (isLoading) {
        return (
            <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center text-secondary">
                Loading projects...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center flex flex-col items-center gap-4">
                <p className="text-error">Failed to load projects. Please try again.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    // If organisation has 0 projects in total, show the empty state
    if (!isLoading && meta && meta.totalProjects === 0) {
        return <EmptyStateSection />;
    }

    return (
        <>
            <div className="w-full">
                {/* Search Box, Filter Controls & View Switcher Bar */}
                <ProjectToolbar
                    searchQuery={searchQuery}
                    onSearchChange={(query) => {
                        setSearchQuery(query);
                        setPage(1);
                    }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={(status) => {
                        setStatusFilter(status);
                        setPage(1);
                    }}
                    onSortChange={handleSort}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onResetFilters={() => {
                        setStatusFilter("ALL");
                        setSearchQuery("");
                        setPage(1);
                    }}
                />

                {/* Content: Grid View or Data Table View */}
                <div className="mb-6">
                    {viewMode === "grid" ? (
                        projects.length === 0 ? (
                            <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center text-secondary">
                                No projects match your filter criteria.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onEdit={handleEdit}
                                        onDelete={handleOpenDeleteDialog}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <DataTable
                            data={projects}
                            columns={projectColumns}
                            getRowId={(project: Project) => project.id}
                            isLoading={isFetching}
                            emptyMessage={
                                searchQuery || statusFilter !== "ALL"
                                    ? "No projects match your filter criteria."
                                    : "No projects found."
                            }
                        />
                    )}
                </div>

                <div className="pb-10">
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
    );
};

export default ProjectItems;