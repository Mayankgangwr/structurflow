import mongoose, { Schema, Document } from "mongoose";
import { Role } from "./membership.model";

export enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REVOKED = "REVOKED",
    EXPIRED = "EXPIRED",
}

export interface IInvitation extends Document {
    organizationId: mongoose.Types.ObjectId;
    email: string;
    role: Role;
    inviterId: mongoose.Types.ObjectId;
    token: string;
    status: InvitationStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.VIEWER,
            required: true,
        },
        inviterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(InvitationStatus),
            default: InvitationStatus.PENDING,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

invitationSchema.index({ organizationId: 1, email: 1, status: 1 });

export const InvitationModel = mongoose.model<IInvitation>("Invitation", invitationSchema);
