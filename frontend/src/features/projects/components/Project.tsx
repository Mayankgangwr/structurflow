import React from "react";
import WelcomeSection from "./WelcomeSection";
import EmptyStateSection from "./EmptyStateSection";
import { useGetProjectsQuery } from "../projectApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProjectItems from "./ProjectItems";

const Project: React.FC = () => {
    const { activeOrganizationId } = useSelector((state: RootState) => state.auth);
    const { data, isLoading, isError, error, refetch } = useGetProjectsQuery(undefined, { skip: !activeOrganizationId });
    return (
        <div className="px-2 py-0 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 xs:gap-6 max-w-360 mx-auto w-full">
            {/* Welcome Section */}
            <WelcomeSection />
            {/* Projects Grid */}
            {isLoading ? (
                <div className="p-8 text-center text-secondary">Loading projects...</div>
            ) : isError ? (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                    <p className="text-error">Failed to load projects. Please try again.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : data?.data?.length ? (
                <ProjectItems projects={data.data} />
            ) : (
                <EmptyStateSection />
            )}
        </div>
    )
}

export default Project;