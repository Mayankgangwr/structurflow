import mongoose, {
    Schema,
    Document as MongooseDocument,
} from "mongoose";

export enum TemplateStatus {
    UPLOADED = "UPLOADED",
    PROCESSING = "PROCESSING",
    READY = "READY",
    FAILED = "FAILED",
}

export type TemplateProcessingStage =
    | "UPLOAD"
    | "EXTRACTION"
    | "HTML_GENERATION"
    | "FIELD_DETECTION"
    | "SCHEMA_GENERATION"
    | "VALIDATION"
    | "COMPLETED";

export interface ITemplateProcessingProgress {
    stage: TemplateProcessingStage;
    percentage: number;
    message?: string;
}

export interface ITemplateExtractedData {
    text: string;
    pages?: number;
    metadata?: Record<string, unknown>;
}

export type TemplateFieldType =
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "currency";

export interface ITemplateField {
    fieldName: string;
    label: string;
    type: TemplateFieldType;
    required: boolean;
    placeholder: string;
    originalValue?: string;
    description?: string;
}

export interface ITemplateSchema {
    version: number;
    fields: ITemplateField[];
}

export interface ITemplate extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    uploadedById: mongoose.Types.ObjectId;

    // Original File Metadata
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    fileHash: string;

    // Storage
    publicId: string;
    secureUrl: string;

    // Processing
    status: TemplateStatus;
    processingProgress?: ITemplateProcessingProgress;
    processingError?: string;

    // PDF Information
    pageCount?: number;
    pageWidth?: number;
    pageHeight?: number;

    // Extracted / Generated Template
    extractedData?: ITemplateExtractedData;
    htmlContent?: string;
    templateSchema?: ITemplateSchema;

    // Version
    version: number;

    isActive: boolean,

    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Processing Progress Schema
 */
const templateProcessingProgressSchema = new Schema<ITemplateProcessingProgress>(
    {
        stage: {
            type: String,
            enum: [
                "UPLOAD",
                "EXTRACTION",
                "HTML_GENERATION",
                "FIELD_DETECTION",
                "SCHEMA_GENERATION",
                "VALIDATION",
                "COMPLETED",
            ],
            default: "UPLOAD",
            required: true,
        },

        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        message: {
            type: String,
            trim: true,
        },
    },
    {
        _id: false,
    }
);

/**
 * Extracted Data Schema
 */
const templateExtractedDataSchema = new Schema<ITemplateExtractedData>(
    {
        text: {
            type: String,
            required: true,
        },

        pages: {
            type: Number,
            min: 1,
        },

        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        _id: false,
    }
);

/**
 * Template Field Schema
 */
const templateFieldSchema = new Schema<ITemplateField>(
    {
        fieldName: {
            type: String,
            required: true,
            trim: true,
        },

        label: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "string",
                "number",
                "date",
                "boolean",
                "currency",
            ],
            required: true,
        },

        required: {
            type: Boolean,
            default: false,
        },

        placeholder: {
            type: String,
            required: true,
            trim: true,
        },

        originalValue: {
            type: String,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },
    },
    {
        _id: false,
    }
);

/**
 * Generated Template Schema
 */
const templateGeneratedSchema = new Schema<ITemplateSchema>(
    {
        version: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },

        fields: {
            type: [templateFieldSchema],
            required: true,
            default: [],
        },
    },
    {
        _id: false,
    }
);

/**
 * Main Template Schema
 */
const templateSchema = new Schema<ITemplate>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        uploadedById: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Original File Metadata
        originalFileName: {
            type: String,
            required: true,
            trim: true,
        },

        mimeType: {
            type: String,
            required: true,
            trim: true,
        },

        sizeBytes: {
            type: Number,
            required: true,
            min: 0,
        },

        fileHash: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        // Storage
        publicId: {
            type: String,
            required: true,
            trim: true,
        },

        secureUrl: {
            type: String,
            required: true,
            trim: true,
        },

        // Processing
        status: {
            type: String,
            enum: Object.values(TemplateStatus),
            default: TemplateStatus.UPLOADED,
            required: true,
            index: true,
        },

        processingProgress: {
            type: templateProcessingProgressSchema,
            default: undefined,
        },

        processingError: {
            type: String,
            trim: true,
        },

        // PDF Information
        pageCount: {
            type: Number,
            min: 1,
        },

        pageWidth: {
            type: Number,
            min: 0,
        },

        pageHeight: {
            type: Number,
            min: 0,
        },

        // Extracted Data
        extractedData: {
            type: templateExtractedDataSchema,
            default: undefined,
        },

        // Generated HTML
        htmlContent: {
            type: String,
        },

        // Generated Template Schema
        templateSchema: {
            type: templateGeneratedSchema,
            default: undefined,
        },

        // Version
        version: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },

        isActive: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Soft Delete
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Indexes
 */

// Get templates for a project
templateSchema.index({ projectId: 1, isDeleted: 1 });

// Get templates for an organization
templateSchema.index({ organizationId: 1, isDeleted: 1 });

// Prevent duplicate active uploads
templateSchema.index(
    {
        organizationId: 1,
        projectId: 1,
        fileHash: 1,
    },
    {
        unique: true,
        partialFilterExpression: {
            isDeleted: false,
        },
        name: "unique_active_template_upload",
    }
);

// Useful for finding templates by processing status
templateSchema.index({ status: 1, isDeleted: 1 });

export const TemplateModel = mongoose.model<ITemplate>("Template", templateSchema);
