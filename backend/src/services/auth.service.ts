import organizationRepository from "@/repositories/organization.repository";
import userRepository from "@/repositories/user.repository";
import membershipRepository from "@/repositories/membership.repository";
import { RegisterFormData } from "@/schemas/auth.schema";
import { ApiErrors } from "@/utils/errors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { Role } from "@/models/membership.model";
import { generateOtp, generateSlug, generateToken, generateWorkspaceName } from "@/utils/generate";
import { redis } from "@/config/redis";
import { config } from "@/config/env";
import { mailService } from "./mail.service";
import crypto from "crypto";
import { IDocument } from "@/models/document.model";

type PendingUser = RegisterFormData & { otpCode: string, lastSentAt?: number };

class AuthService {
    private generateAuthResponse(user: any, memberships: any[]) {
        return {
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
            memberships: memberships.map((m) => ({ organizationId: m.organizationId?._id ? m.organizationId._id.toString() : m.organizationId.toString(), role: m.role })),
            accessToken: generateAccessToken({ userId: user._id.toString(), email: user.email }),
            refreshToken: generateRefreshToken({ userId: user._id.toString() })
        };
    }

    async register(payload: RegisterFormData) {
        const emailTaken = await userRepository.emailExists(payload.email);
        if (emailTaken) throw ApiErrors.emailAlreadyExists();

        const otpCode = generateOtp();
        const token = generateToken();

        await redis.setJson(`user_verify:${token}`, { ...payload, otpCode, lastSentAt: Date.now() }, (Number(config.PENDING_SIGNUP_TTL_MINUTES) * 60 * 1000));
        await mailService.sendOtpEmail(payload.email, otpCode, token);

        return { token, expiresIn: config.PENDING_SIGNUP_TTL_MINUTES };
    }

    async resendOTP(token: string) {
        const pendingUser = await redis.getJson(`user_verify:${token}`) as PendingUser;
        if (!pendingUser) throw ApiErrors.invalidToken();

        const now = Date.now();
        if (pendingUser.lastSentAt && now - pendingUser.lastSentAt < 60000) {
            throw ApiErrors.tooManyRequests();
        }

        const newOtpCode = generateOtp();
        await redis.setJson(`user_verify:${token}`, { ...pendingUser, otpCode: newOtpCode, lastSentAt: now }, (Number(config.PENDING_SIGNUP_TTL_MINUTES) * 60 * 1000));
        await mailService.sendOtpEmail(pendingUser.email, newOtpCode, token);

        return { token, expiresIn: config.PENDING_SIGNUP_TTL_MINUTES };
    }

    async confirmRegistration(payload: { token: string, otpCode: string }) {
        const pendingUser = await redis.getJson(`user_verify:${payload.token}`) as PendingUser;
        if (!pendingUser) throw ApiErrors.invalidToken();
        if (payload.otpCode !== pendingUser.otpCode) throw ApiErrors.invalidToken();

        const emailTaken = await userRepository.emailExists(pendingUser.email);
        if (emailTaken) throw ApiErrors.emailAlreadyExists();

        const passwordHash = await bcrypt.hash(pendingUser.password, 12);
        try {
            const user = await userRepository.create({
                email: pendingUser.email,
                passwordHash,
                firstName: pendingUser.firstName,
                lastName: pendingUser.lastName,
                isEmailVerified: true
            });

            let organizationName = pendingUser.organizationName;
            let slug;

            if (!organizationName) {
                const workspace = generateWorkspaceName(pendingUser.firstName);
                organizationName = workspace.name;
                slug = workspace.slug;
            } else {
                slug = generateSlug(organizationName);
            }

            const organization = await organizationRepository.create({
                name: organizationName,
                slug,
            });

            const membership = await membershipRepository.create({
                userId: user._id,
                organizationId: organization._id,
                role: Role.OWNER,
            });

            const authResponse = this.generateAuthResponse(user, [membership]);
            return {
                ...authResponse,
                organization: { id: organization._id, name: organization.name }
            };
        } catch (error) {
            throw error;
        }
    }

    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) throw ApiErrors.invalidCredentials();

        const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isCorrectPassword) throw ApiErrors.invalidCredentials();

        const memberships = await membershipRepository.findAllByUser(user._id.toString());
        return this.generateAuthResponse(user, memberships);
    }

    async getMe(userId: string) {
        const user = await userRepository.findById(userId);
        if (!user) throw ApiErrors.invalidCredentials();

        const memberships = await membershipRepository.findAllByUser(user._id.toString());
        return {
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
            memberships: memberships.map((m: any) => ({ organizationId: m.organizationId?._id ? m.organizationId._id.toString() : m.organizationId.toString(), role: m.role })),
        };
    }

    async refreshToken(refreshToken: string) {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await userRepository.findById(decoded.userId);
        if (!user) throw ApiErrors.invalidCredentials();

        const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
        const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });
        return { accessToken, refreshToken: newRefreshToken };
    }

    async forgotPassword(email: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) return; // Silent success for security

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        await redis.setJson(`reset_password:${hashedToken}`, user._id.toString(), 15 * 60);

        await mailService.sendResetPasswordEmail(user.email, resetToken);
    }

    async resetPassword(token: string, newPassword: string) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const userId = await redis.getJson(`reset_password:${hashedToken}`) as string;
        if (!userId) throw ApiErrors.invalidResetToken();

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await userRepository.updateById(userId, { passwordHash });

        await redis.del(`reset_password:${hashedToken}`);
    }

    async getInviteInfo(token: string) {
        const inviteData = await redis.getJson(`org_invite:${token}`) as { email: string; organizationId: string; role: Role };
        if (!inviteData) throw ApiErrors.invalidOrExpiredInvite();

        const { email, organizationId } = inviteData;
        const user = await userRepository.findByEmail(email);
        const org = await organizationRepository.findById(organizationId);

        return {
            email,
            isRegistered: !!user,
            organizationName: org?.name || 'an organization'
        };
    }

    async acceptInvite(token: string, payload: { firstName?: string, lastName?: string, password?: string }) {
        const inviteData = await redis.getJson(`org_invite:${token}`) as { email: string; organizationId: string; role: Role };
        if (!inviteData) throw ApiErrors.invalidOrExpiredInvite();

        const { email, organizationId, role } = inviteData;
        let user: any = await userRepository.findByEmail(email);

        try {
            if (!user) {
                if (!payload.firstName || !payload.password) {
                    throw ApiErrors.registrationDetailsRequired();
                }
                const passwordHash = await bcrypt.hash(payload.password, 12);

                user = await userRepository.create({
                    email,
                    passwordHash,
                    firstName: payload.firstName,
                    lastName: payload.lastName || '',
                    isEmailVerified: true
                });
            }

            if (!user) throw ApiErrors.userNotFound();

            const existingMembership = await membershipRepository.findByUserAndOrg(user._id.toString(), organizationId);
            if (existingMembership) throw ApiErrors.duplicateMembership();

            await membershipRepository.create({
                userId: user._id,
                organizationId: new mongoose.Types.ObjectId(organizationId),
                role
            });

            await redis.del(`org_invite:${token}`);

            const memberships = await membershipRepository.findAllByUser(user._id.toString());
            return this.generateAuthResponse(user, memberships);
        } catch (error) {
            throw error;
        }
    }
}

const authService = new AuthService();
export default authService;