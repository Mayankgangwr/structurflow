import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IProject extends MongooseDocument {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    templateDocumentId?: mongoose.Types.ObjectId; // The gold-standard template
    createdById: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    templateDocumentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const ProjectModel = mongoose.model<IProject>("Project", projectSchema);
