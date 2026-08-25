import { Dialog } from "@/components/ui/dialog";
import React, { useState } from "react";
import { Project } from "../projectApi";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Info, FileText, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IDeleteConformationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: (projectId: string) => void;
    project: Project;
}

const DeleteConformationDialog: React.FC<IDeleteConformationDialogProps> = ({ isOpen, onClose, onDelete, project }) => {
    const [confirmName, setConfirmName] = useState("");
    const isConfirmValid = confirmName === project.name;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            showCloseButton={false}
            footer={
                <div className="flex items-center justify-end gap-md w-full">
                    <Button onClick={onClose} variant="outline" className="font-label-md px-md py-sm">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (isConfirmValid) {
                                onDelete(project.id);
                                onClose();
                            }
                        }}
                        disabled={!isConfirmValid}
                        variant="destructive"
                        className="font-label-md min-w-[120px] shadow-sm px-md py-sm"
                    >
                        Delete Project
                    </Button>
                </div>
            }
        >
            <div className="-m-4">
                {/* Header */}
                <div className="flex items-start gap-2 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
                        <TriangleAlert className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-headline-sm text-headline-sm font-semibold text-text-primary">
                            Delete project?
                        </h2>

                        <p className="text-xs leading-5 text-secondary truncate">
                            This action will permanently delete the project and its associated
                            data. This cannot be undone.
                        </p>
                    </div>
                </div>

                {/* Content Body */}
                <div className="px-md pb-sm flex flex-col gap-md pt-0">
                    {/* Project Detail Section */}
                    <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-container-low p-4">
                        {/* Icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-primary">
                            <Folder className="h-4 w-4" />
                        </div>

                        {/* Project Info */}
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-body-md text-body-md font-semibold text-text-primary">
                                {project.name}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-secondary">
                                <span className="text-xs">Last updated</span>
                                <span className="text-xs font-medium text-text-primary">
                                    {project.lastActivity}
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* Confirmation Field */}
                    <div className="flex flex-col gap-xs mt-sm">
                        <Label className="font-label-md text-label-md text-text-primary" htmlFor="confirm-name">
                            Type the project name to confirm
                        </Label>
                        <Input
                            id="confirm-name"
                            placeholder={project.name}
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="block w-full font-body-sm text-body-sm"
                        />
                        <p className="font-label-sm text-label-sm text-secondary">Enter the project name exactly as shown above.</p>
                    </div>
                </div>
            </div >
        </Dialog >
    );
};

export default DeleteConformationDialog;