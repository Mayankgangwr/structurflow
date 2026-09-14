import React from 'react'
import ProjectDetails from '@/features/projects/components/project-details'

interface IProjectDetailsPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

const ProjectDetailsPage = async ({ params }: IProjectDetailsPageProps) => {
    const { projectId } = await params;
    return (
        <ProjectDetails projectId={projectId} />
    );
};

export default ProjectDetailsPage;