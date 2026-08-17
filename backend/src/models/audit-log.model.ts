import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum AuditAction {
    DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
    DOCUMENT_DELETED = 'DOCUMENT_DELETED',
    DOCUMENT_STATUS_CHANGED = 'DOCUMENT_STATUS_CHANGED',
    EXTRACTION_APPROVED = 'EXTRACTION_APPROVED',
    EXTRACTION_REJECTED = 'EXTRACTION_REJECTED'
}

export interface IAuditLog extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    actorId: mongoose.Types.ObjectId; // The user who performed the action
    documentId?: mongoose.Types.ObjectId;
    action: AuditAction;
    details: any;
    ipAddress?: string;

    createdAt: Date;
    updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true
        },
        actorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        documentId: {
            type: Schema.Types.ObjectId,
            ref: 'Document'
        },
        action: {
            type: String,
            enum: Object.values(AuditAction),
            required: true
        },
        details: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String }
    },
    { timestamps: true }
);

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);