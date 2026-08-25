import React from 'react'
import ProjectDetails from '@/features/projects/components/project-details'

interface IProjectDetailsPageProps {
    params: {
        projectId: string;
    };
}

const ProjectDetailsPage: React.FC<IProjectDetailsPageProps> = async ({ params }) => {
    const { projectId } = await params;
    console.log(projectId);
    return (
        <ProjectDetails projectId={projectId} />
    )
}

export default ProjectDetailsPage