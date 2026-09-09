"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Folders } from "lucide-react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

const EmptyStateSection: React.FC = () => {
    const { can } = usePermissions();

    return (
        <div className="flex-1 flex items-center justify-center border border-border-subtle border-dashed rounded-xl bg-surface/50 backdrop-blur-sm p-xxl min-h-[400px]" >
            <div className="text-center flex flex-col items-center max-w-md">
                {/* Icon / Illustration */}
                <div
                    className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Folders className="h-10 w-10 text-primary" />
                </div>
                {/* Copy */}
                <h3 className="font-headline-md text-headline-md font-semibold text-text-primary mb-2">
                    {can("create_project") ? "Create your first project" : "No projects found"}
                </h3>
                <p className="font-body-md text-body-md text-secondary mb-6 text-sm">
                    {can("create_project")
                        ? "Projects help you organize related documents, set specific processing rules, and collaborate with your team efficiently."
                        : "No projects have been set up in this organization yet. Contact an administrator or owner to create one."}
                </p>
                {/* CTA */}
                {can("create_project") && (
                    <Button
                        className={`bg-primary !text-white hover:!text-white mb-md font-label-md hover:bg-primary-container transition-colors shrink-0`}
                        title={"New Project"}
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <span>New Project</span>
                        </div>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default EmptyStateSection;
