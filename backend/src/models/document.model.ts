import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export enum DocumentStatus {
    UPLOADED = 'UPLOADED',
    PROCESSING = 'PROCESSING',
    REVIEW_REQUIRED = 'REVIEW_REQUIRED',
    TRUSTED = 'TRUSTED',
    REJECTED = 'REJECTED',
    FAILED = 'FAILED'
}

export interface IDocument extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    uploadedById: mongoose.Types.ObjectId;
    documentType: 'TEMPLATE' | 'RAW' | 'TRANSFORMED';

    // Original File Metadata
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    fileHash: string; // // Used for duplicate detection (SHA-256)

    // Storage (Cloudinary)
    publicId: string; // Cloudinary public_id
    secureUrl: string; // Cloudinary secure_url for viewing

    // Processing State
    status: DocumentStatus;
    processingProgress?: any; // To be expanded in Phase 4
    extractedData?: any;      // To be expanded in Phase 5

    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
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
        documentType: {
            type: String,
            enum: ['TEMPLATE', 'RAW', 'TRANSFORMED'],
            required: true,
            default: 'RAW'
        },

        originalFileName: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        sizeBytes: {
            type: Number,
            required: true
        },
        fileHash: {
            type: String,
            required: true
        },

        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: Object.values(DocumentStatus),
            default: DocumentStatus.UPLOADED,
            index: true
        },

        processingProgress: { type: Schema.Types.Mixed },
        extractedData: { type: Schema.Types.Mixed },

        isDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
    }
);

// Compound index for finding duplicate files within the SAME organization
documentSchema.index({ organizationId: 1, fileHash: 1 });

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema)