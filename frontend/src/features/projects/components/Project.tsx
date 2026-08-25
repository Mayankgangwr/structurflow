import React from "react";
import WelcomeSection from "./WelcomeSection";
import EmptyStateSection from "./EmptyStateSection";
import { useGetProjectsQuery } from "../projectApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProjectItems from "./ProjectItems";

const Project: React.FC = () => {
    const { activeOrganizationId } = useSelector((state: RootState) => state.auth);
    const { data, isLoading, isError, error, refetch } = useGetProjectsQuery({ skip: !activeOrganizationId });
    return (
        <div className="px-2 py-0 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 xs:gap-6 max-w-360 mx-auto w-full">
            {/* Welcome Section */}
            <WelcomeSection />
            {/* Projects Grid */}
            {isLoading ? (
                <div>Loading....</div>
            ) : data?.data?.length ? (
                <ProjectItems projects={data.data} />
            ) : (
                <EmptyStateSection />
            )}
        </div>
    )
}

export default Project;