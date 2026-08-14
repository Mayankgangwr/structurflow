import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    slug: string; // Used for URLs if needed
    createdAt: Date;
    updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
    },
    { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);