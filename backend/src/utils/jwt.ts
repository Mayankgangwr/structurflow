import jwt from "jsonwebtoken";
import { config } from "@/config/env";
import { Role } from "@/models/membership.model";

export interface TokenPayload {
    userId: string;
    email?: string;
    role?: Role;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
        expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
};