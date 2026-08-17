import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        isEmailVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);