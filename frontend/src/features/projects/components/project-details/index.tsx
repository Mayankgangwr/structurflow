"use client";

import React from 'react'
import { useGetProjectByIdQuery } from '../../projectApi';
import ProjectWelcomeSection from './WelcomeSection';
import UploadTemplate from './UploadTemplate';
import DocumentSection from './DocumentSection';
import { Template } from '@/features/templates/templateApi';
import { useGetDocumentsQuery } from '@/features/documents/documentApi';

interface IProjectDetailsProps {
    projectId: string;
}


const ProjectDetails: React.FC<IProjectDetailsProps> = ({ projectId }) => {
    const { data, isLoading } = useGetProjectByIdQuery(projectId);
    const { data: documentsData, isLoading: isDocumentloading } = useGetDocumentsQuery({});

    const projectResponse = data?.data;
    const documentsResponse = documentsData?.data;

    if (isLoading) {
        return <div className="p-8 text-center text-secondary">Loading project details...</div>;
    }

    if (!projectResponse) {
        return <div className="p-8 text-center text-error">Project not found.</div>;
    }

    const activeTemplate: Template | undefined = projectResponse.templateData;
    return (
        <div className="p-2 xs:px-4 xs:py-4 pb-24 lg:pb-4 flex-1 flex flex-col gap-4 xs:gap-6 max-w-360 mx-auto w-full">
            <ProjectWelcomeSection project={projectResponse} />
            {activeTemplate ? (
                <DocumentSection documentsResponse={documentsResponse} activeTemplate={activeTemplate} />
            ) : (
                <UploadTemplate projectId={projectId} />
            )}
        </div>
    )
}

export default ProjectDetails
