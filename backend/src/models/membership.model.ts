import mongoose, { Schema, Document } from "mongoose";

export enum Role {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    REVIEWER = 'REVIEWER',
    VIEWER = 'VIEWER'
}

export interface IMembership extends Document {
    userId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

const membershipSchema = new Schema<IMembership>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
        role: { type: String, enum: Object.values(Role), default: Role.VIEWER, required: true },
    },
    { timestamps: true }
);

membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
 
export const Membership = mongoose.model<IMembership>('Membership', membershipSchema);