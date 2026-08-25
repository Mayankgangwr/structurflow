import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Folders } from "lucide-react";

const EmptyStateSection: React.FC = () => {
    return (
        <div className="flex-1 flex items-center justify-center border border-border-subtle border-dashed rounded-xl bg-surface/50 backdrop-blur-sm p-xxl min-h-[400px]" >
            <div className="text-center flex flex-col items-center">
                {/* Icon / Illustration */}
                <div
                    className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-lg">
                    <Folders className="h-12 w-12 text-primary" />
                </div>
                {/* Copy */}
                <h3 className="font-headline-md text-headline-md text-text-primary mb-sm">Create
                    your first project</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-xl">
                    Projects help you organize related documents, set specific processing
                    rules, and collaborate with your team efficiently.
                </p>
                {/* CTA */}
                <Button
                    className={`bg-primary !text-white hover:!text-white mb-md font-label-md hover:bg-primary-container transition-colors shrink-0`}
                    title={"New Project"}
                >
                    <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        <span>New Project</span>
                    </div>
                </Button>
                <button
                    className="mt-md text-primary font-label-md text-label-md hover:underline bg-transparent border-none">
                    Learn more about Projects
                </button>
            </div>
        </div>
    )
}

export default EmptyStateSection;
