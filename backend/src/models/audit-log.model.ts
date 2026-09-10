import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export enum AuditAction {
    DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
    DOCUMENT_TRANSFORMED = 'DOCUMENT_TRANSFORMED',
    DOCUMENT_DELETED = 'DOCUMENT_DELETED',
    DOCUMENT_STATUS_CHANGED = 'DOCUMENT_STATUS_CHANGED',
    EXTRACTION_APPROVED = 'EXTRACTION_APPROVED',
    EXTRACTION_REJECTED = 'EXTRACTION_REJECTED',
    DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
    DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',

    // Template actions
    TEMPLATE_UPLOADED = 'TEMPLATE_UPLOADED',
    TEMPLATE_PROCESSED = 'TEMPLATE_PROCESSED',

    // Project actions
    PROJECT_CREATED = 'PROJECT_CREATED',
    PROJECT_UPDATED = 'PROJECT_UPDATED',
    PROJECT_DELETED = 'PROJECT_DELETED',

    // Team actions
    MEMBER_INVITED = 'MEMBER_INVITED',
    MEMBER_ROLE_UPDATED = 'MEMBER_ROLE_UPDATED',
    MEMBER_REMOVED = 'MEMBER_REMOVED',
    INVITE_REVOKED = 'INVITE_REVOKED',
    INVITE_ACCEPTED = 'INVITE_ACCEPTED',
    USER_REGISTERED = 'USER_REGISTERED',
}

export interface IAuditLog extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    actorId: mongoose.Types.ObjectId; // The user who performed the action
    documentId?: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId;
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
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project'
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

auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, action: 1 });
auditLogSchema.index({ documentId: 1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);