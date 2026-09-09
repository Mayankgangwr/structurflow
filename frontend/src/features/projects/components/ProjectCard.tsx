"use client";

import React from "react";
import { Folder, FileText, ArrowRight, Edit2, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "../projectApi";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
    const router = useRouter();
    const { can } = usePermissions();

    const handleOpenProject = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/project/${project.id}`);
    };

    return (
        <div
            onClick={handleOpenProject}
            className="group bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer h-full"
        >
            <div className="p-2.5 pt-4 flex flex-col flex-1">
                {/* Header Row: Icon + Title/Badge + Menu */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 group-hover:bg-indigo-100/70 transition-all">
                            <Folder className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                                <h3
                                    className="font-semibold text-slate-900 text-base leading-snug tracking-tight truncate group-hover:text-indigo-600 transition-colors"
                                    title={project.name}
                                >
                                    {project.name}
                                </h3>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                                        project.status === "Active"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            project.status === "Active"
                                                ? "bg-emerald-500 animate-pulse"
                                                : "bg-slate-400"
                                        )}
                                    />
                                    {project.status}
                                </span>
                            </div>

                            {/* Metadata Row */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                    {project.documents.toLocaleString()} {project.documents === 1 ? "document" : "documents"}
                                </span>
                                <span>•</span>
                                <span>{project.activeTemplateId ? "1 template" : "0 templates"}</span>
                            </div>
                        </div>
                    </div>

                    {/* More Options Menu (gated for OWNER / ADMIN) */}
                    {(can("edit_project") || can("delete_project")) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors shrink-0 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                title="More options"
                            >
                                <MoreVertical className="w-4 h-4 block" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-white border border-slate-200">
                                {can("edit_project") && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(project);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        <span>Edit Project</span>
                                    </DropdownMenuItem>
                                )}
                                {can("delete_project") && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(project.id);
                                        }}
                                        className="cursor-pointer text-rose-600 focus:text-rose-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        <span>Delete Project</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Description */}
                <p
                    className="text-xs text-slate-500 line-clamp-2 min-h-10 mt-2 mb-4 leading-relaxed overflow-hidden text-ellipsis"
                    title={project.description || "No description provided."}
                >
                    {project.description || "No description provided."}
                </p>

                {/* Metrics Section */}
                <div className="bg-slate-50/80 rounded-lg border border-slate-100 p-2.5 flex items-stretch text-left mt-auto min-h-[62px]">
                    {/* Left: Needs Verify (27%) */}
                    <div className="w-[27%] flex flex-col justify-between pr-2">
                        <span className="text-[11px] font-medium text-slate-500 leading-tight truncate block">
                            Needs Verify
                        </span>
                        <span
                            className={cn(
                                "text-sm font-bold leading-none mt-1.5",
                                project.needsVerification > 0 ? "text-amber-600" : "text-slate-800"
                            )}
                        >
                            {project.needsVerification}
                        </span>
                    </div>

                    {/* Middle: Success Rate (46%) */}
                    <div className="w-[46%] flex flex-col justify-between border-x border-slate-200/60 px-2.5">
                        <span className="text-[11px] font-medium text-slate-500 leading-tight truncate block">
                            Success Rate
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 w-full">
                            <span className="text-xs font-bold text-slate-900 leading-none shrink-0">
                                {project.successRate}%
                            </span>
                            <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${project.successRate}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Last Activity (27%) */}
                    <div className="w-[27%] flex flex-col justify-between pl-2">
                        <span className="text-[11px] font-medium text-slate-500 leading-tight truncate block">
                            Last Activity
                        </span>
                        <span
                            className="text-xs font-medium text-slate-500 mt-1.5 truncate block leading-none"
                            title={project.lastActivity}
                        >
                            {project.lastActivity}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">

                <Button
                    variant="link"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline transition-colors cursor-pointer"
                    onClick={handleOpenProject}
                >
                    <span>Open Project</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
                {(can("edit_project") || can("delete_project")) && (
                    <div className="flex items-center gap-1">
                        {can("edit_project") && (
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project);
                                }}
                                className="text-primary/70 hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                size={"icon-sm"}
                                title="Edit Project"
                            >
                                <Edit2 className="h-5 w-5" />
                            </Button>
                        )}
                        {can("delete_project") && (
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project.id);
                                }}
                                className="text-error hover:text-error transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                size={"icon-sm"}
                                title="Delete Project"
                            >
                                <Trash2 className="h-5 w-5 text-error/70 hover:text-error" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;
