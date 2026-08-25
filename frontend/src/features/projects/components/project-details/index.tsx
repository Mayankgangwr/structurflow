"use client";

import React from 'react'
import { useGetProjectByIdQuery } from '../../projectApi';
import ProjectWelcomeSection from './WelcomeSection';
import { Braces, Upload, Sheet, FileText, Files } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IProjectDetailsProps {
    projectId: string;
}


const ProjectDetails: React.FC<IProjectDetailsProps> = ({ projectId }) => {
    const { data: projectResponse, isLoading } = useGetProjectByIdQuery(projectId);

    if (isLoading) {
        return <div className="p-8 text-center text-secondary">Loading project details...</div>;
    }

    if (!projectResponse?.data) {
        return <div className="p-8 text-center text-error">Project not found.</div>;
    }

    return (
        <div className="px-2 py-0 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 xs:gap-6 max-w-360 mx-auto w-full">
            <ProjectWelcomeSection project={projectResponse.data} />
            <div
                className="bg-surface rounded-xl border border-border-subtle overflow-hidden relative transition-all duration-200 hover:border-primary/30 group flex-1 flex flex-col">
                <div className="p-lg md:p-xl flex-1 flex flex-col items-center justify-center text-center min-h-[320px] border-2 border-dashed border-border-subtle rounded-lg m-md bg-background/50 hover:bg-background transition-colors cursor-pointer"
                    id="dropzone">
                    <div
                        className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Upload />
                    </div>
                    <h3 className="font-headline-md text-headline-md text-text-primary mb-2">Upload Transformation
                        Template</h3>
                    <p className="font-body-sm text-body-sm text-secondary mb-6">
                        Drag and drop your template here, or <button
                            className="text-primary hover:underline font-medium focus:outline-none">browse
                            files</button>
                    </p>
                    <div
                        className="flex flex-wrap items-center justify-center gap-3 font-label-sm text-label-sm text-secondary mb-8">
                        <span
                            className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                            <Files className='h-3 w-3' /> PDF
                        </span>
                        <span
                            className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                            <FileText className='h-3 w-3' /> DOCX
                        </span>
                        <span
                            className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                            <Sheet className='h-3 w-3' /> XLSX, CSV
                        </span>
                        <span
                            className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                            <Braces className='h-3 w-3' /> JSON
                        </span>
                    </div>
                    <p className="font-label-sm text-label-sm text-outline mb-6">Maximum file size: 50MB</p>
                    <Button
                        className={`px-6 py-4 bg-primary !text-white hover:!text-white mb-md font-label-md hover:bg-primary-container transition-colors shrink-0 rounded-md text-label-md`}
                    >
                        Select Template File
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ProjectDetails
