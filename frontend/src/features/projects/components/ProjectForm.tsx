import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProjectMutation, useUpdateProjectMutation, Project } from "../projectApi";
import { useSelector } from "react-redux";

const projectSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export interface ProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, project }) => {
    const orgId = useSelector((state: any) => state.auth.activeOrganizationId);

    const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
    const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

    const isEditMode = !!project;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const nameValue = watch("name") || "";

    useEffect(() => {
        if (isOpen && project) {
            reset({
                name: project.name,
                description: project.description || "",
            });
        } else if (isOpen) {
            reset({
                name: "",
                description: "",
            });
        }
    }, [isOpen, project, reset]);

    const onSubmit = async (data: ProjectFormValues) => {
        if (!orgId) return;

        try {
            if (isEditMode && project) {
                await updateProject({
                    projectId: project.id,
                    name: data.name,
                    description: data.description,
                }).unwrap();
            } else {
                await createProject({
                    name: data.name,
                    description: data.description || "", //description is not in create payload currently in api, but we can pass it if we update API or ignore for now
                }).unwrap();
            }
            onClose();
        } catch (error) {
            console.error("Failed to save project", error);
            // Handle error (e.g. show toast)
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title={isEditMode ? "Update Project" : "Create New Project"}
            description={isEditMode ? "Modify your transformation project details." : "Create a new project to start transforming documents."}
            size="md"
            footer={
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2 w-full">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isLoading} className="w-full sm:w-auto bg-primary text-white hover:bg-primary-container font-label-md">
                        {isLoading ? "Saving..." : isEditMode ? "Update Project" : "Create Project"}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="name" className="text-text-primary font-bold">Project Name <span className="text-error">*</span></Label>
                        {/* We use watch("name") or similar for dynamic length, but static for now is fine since we aren't re-rendering on every keystroke by default. Using register won't trigger re-renders. A simple max-length is enough. */}
                        <span className="text-[10px] text-secondary">{nameValue.length}/100</span>
                    </div>
                    <Input
                        id="name"
                        placeholder="e.g. Invoice Data Transformation"
                        {...register("name")}
                        maxLength={100}
                        aria-invalid={!!errors.name}
                        className="h-10 text-sm"
                    />
                    {errors.name ? (
                        <p className="text-xs text-error">{errors.name.message}</p>
                    ) : (
                        <p className="text-xs text-secondary">Choose a clear name so your team can easily identify this project.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-text-primary font-bold">Description <span className="text-secondary font-normal">(Optional)</span></Label>
                    <textarea
                        id="description"
                        placeholder="Describe what this project is used for..."
                        {...register("description")}
                        rows={4}
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-secondary focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none dark:bg-input/30"
                        aria-invalid={!!errors.description}
                    />
                    {errors.description ? (
                        <p className="text-xs text-error">{errors.description.message}</p>
                    ) : (
                        <p className="text-xs text-secondary">Add a short description to help your team understand the purpose of this project.</p>
                    )}
                </div>

                {!isEditMode && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest border border-border-subtle">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold text-text-primary">AI-Powered Templating</h4>
                            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                                Once created, you can assign pre-trained AI models or custom templates to automatically extract and structure data from your documents.
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </Dialog>
    );
};

export default ProjectForm;