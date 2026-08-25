import React from "react";
import { Project } from "../../projectApi";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed } from "lucide-react";

interface IProjectWelcomeSectionProps {
    project: Project;
}

const ProjectWelcomeSection: React.FC<IProjectWelcomeSectionProps> = ({ project }) => {
    const { name, description, id, status } = project;
    return (
        <div className="w-full flex flex-col">
            <div className="w-full flex justify-between items-center gap-3">
                <h1
                    className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary">
                    {name || `Project ${id}`}
                </h1>
                <Badge
                    className={cn("px-2.5 py-1 text-sm font-medium flex items-center gap-1.5 border",
                        status === "Active" ? "bg-warning/10 text-warning  border-warning/20" :
                            "bg-green-200 text-green-700 border-green-400"
                    )}
                >
                    {status !== "Active" ? <CheckCircle2 className="w-4 h-4" /> : <CircleDashed className="w-4 h-4 text-secondary" />}
                    {status}
                </Badge>
            </div>
            <p className="hidden xs:block font-body-sm text-body-sm text-secondary">{description}</p>
        </div>
    )
}

export default ProjectWelcomeSection;