import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export enum TemplateStatus {
    UPLOADED = 'UPLOADED',
    PROCESSING = 'PROCESSING',
    PARSED = 'PARSED',
    FAILED = 'FAILED'
}

export interface ITargetSchemaField {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
    required: boolean;
    description?: string;
}

export interface ITargetSchema {
    documentType: string;
    fields: ITargetSchemaField[];
}

export interface ITemplate extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    uploadedById: mongoose.Types.ObjectId;

    // File Metadata
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    fileHash: string;

    // Storage (Supabase)
    publicId: string;
    secureUrl: string;

    // Template-specific: the parsed schema and html template
    targetSchema?: ITargetSchema;
    htmlTemplate?: string;

    // Processing
    status: TemplateStatus;
    processingError?: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true
        },
        uploadedById: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        originalFileName: { type: String, required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        fileHash: { type: String, required: true },

        publicId: { type: String, required: true },
        secureUrl: { type: String, required: true },

        targetSchema: { type: Schema.Types.Mixed },
        htmlTemplate: { type: String },

        status: {
            type: String,
            enum: Object.values(TemplateStatus),
            default: TemplateStatus.UPLOADED,
            index: true
        },
        processingError: { type: String },

        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

templateSchema.index({ organizationId: 1, fileHash: 1 });
// One active template per project (find the latest non-deleted one)
templateSchema.index({ projectId: 1, isDeleted: 1, createdAt: -1 });

export const TemplateModel = mongoose.model<ITemplate>("Template", templateSchema);
