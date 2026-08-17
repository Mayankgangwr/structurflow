import { Request, Response } from "express"
import { config } from "@/config/env"
import { asyncHandler } from "@/utils/asyncHandler"
import { ok } from "@/utils/response"
import authService from "@/services/auth.service"
import { ApiErrors } from "@/utils/errors"

const setAccessTokenCookie = (res: Response, token: string) => {
    res.cookie('accessToken', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction,
        maxAge: 60 * 60 * 1000, // 1 hour
    })
}

const setRefreshTokenCookie = (res: Response, token: string) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
}

const clearTokenCookie = (res: Response, tokenName: "accessToken" | "refreshToken") => {
    res.clearCookie(tokenName);
};

export const authController = {
    register: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);
        return ok(res, result, 'Registration successful', 201);
    }),

    verifyOTP: asyncHandler(async (req: Request, res: Response) => {
        const { token, otp } = req.body;
        const result = await authService.confirmRegistration({ token, otpCode: otp });
        setAccessTokenCookie(res, result.accessToken);
        setRefreshTokenCookie(res, result.refreshToken);
        return ok(res, { user: result.user, organization: result.organization }, 'Registration successful', 201);
    }),

    resendOTP: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.resendOTP(req.body.token);
        return ok(res, result, 'OTP resent successfully', 200);
    }),

    login: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(req.body.email, req.body.password);
        setAccessTokenCookie(res, result.accessToken);
        setRefreshTokenCookie(res, result.refreshToken);
        return ok(res, { user: result.user, memberships: result.memberships }, 'Login successful', 200);
    }),
    logout: asyncHandler(async (_req: Request, res: Response) => {
        clearTokenCookie(res, "accessToken");
        clearTokenCookie(res, "refreshToken");
        return ok(res, null, 'Logged out successfully', 200);
    }),
    getMe: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.getMe(req.user!._id);
        return ok(res, result, 'User fetched successfully', 200);
    }),

    refresh: asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) throw ApiErrors.unauthorized();

        const result = await authService.refreshToken(refreshToken);
        setAccessTokenCookie(res, result.accessToken);
        setRefreshTokenCookie(res, result.refreshToken);

        return ok(res, result, 'Token refreshed successfully', 200);
    }),

    forgotPassword: asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        await authService.forgotPassword(email);
        return ok(res, null, 'If an account exists, a reset link was sent.', 200);
    }),

    resetPassword: asyncHandler(async (req: Request, res: Response) => {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        return ok(res, null, 'Password reset successful', 200);
    }),

    getInviteInfo: asyncHandler(async (req: Request, res: Response) => {
        const token = req.params.token as string;
        const result = await authService.getInviteInfo(token);
        return ok(res, result, 'Invite info fetched successfully', 200);
    }),

    acceptInvite: asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.acceptInvite(req.body.token, req.body);
        setAccessTokenCookie(res, result.accessToken);
        setRefreshTokenCookie(res, result.refreshToken);
        return ok(res, { user: result.user, memberships: result.memberships }, 'Invite accepted successfully', 200);
    }),
}