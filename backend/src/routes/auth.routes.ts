import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { validateRequest } from '@/middlewares/validate.middleware';
import { requireAuth } from '@/middlewares/auth.middleware';
import { 
    registerSchema, 
    loginSchema, 
    verifyOtpSchema, 
    resendOtpSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema 
} from '@/schemas/auth.schema';

const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOTP);
authRouter.post('/resend-otp', validateRequest(resendOtpSchema), authController.resendOTP);

authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.getMe);
authRouter.post('/refresh', authController.refresh);

authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

authRouter.post('/accept-invite', authController.acceptInvite);

export default authRouter;
