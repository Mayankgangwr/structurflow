import React, { useState } from "react";
import WelcomeSection from "./WelcomeSection";
import ProjectItems from "./ProjectItems";
import ProjectForm from "./ProjectForm";

const Project: React.FC = () => {
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

    return (
        <div className="px-2 py-0 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 xs:gap-6 max-w-360 mx-auto w-full pb-12">
            {/* Welcome Section */}
            <WelcomeSection onOpenNewProject={() => setIsProjectFormOpen(true)} />
            {/* Projects Items with Server-Side Toolbar, Table & Pagination */}
            <ProjectItems />
            {isProjectFormOpen && (
                <ProjectForm
                    isOpen={isProjectFormOpen}
                    onClose={() => setIsProjectFormOpen(false)}
                />
            )}
        </div>
    );
};

export default Project;