import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { UserRepository } from '@/repositories/user.repository';
import { MembershipRepository } from '@/repositories/membership.repository';
import { Role } from '@/models/membership.model';
import { ApiErrors } from '@/utils/errors';

/**
 * Verifies JWT from HTTP-only cookie and attaches user to request.
 */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) throw ApiErrors.unauthorized();

        const decoded = verifyAccessToken(token);
        const user = await UserRepository.findById(decoded.userId);
        if (!user) throw ApiErrors.userNotFound();

        req.user = {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        req.token = token;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Checks if authenticated user has a membership with the correct role
 * in the organization specified by the X-Organization-Id header.
 */
export const requireOrgAccess = (allowedRoles: Role[] = Object.values(Role)) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const rawOrgId = req.headers['x-organization-id'] || req.params.orgId;
            const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
            if (!orgId) throw ApiErrors.orgIdRequired();

            const membership = await MembershipRepository.findByUserAndOrg(req.user!._id, orgId);
            if (!membership) throw ApiErrors.membershipNotFound();
            if (!allowedRoles.includes(membership.role as Role)) throw ApiErrors.insufficientPermissions();

            req.membership = {
                _id: membership._id.toString(),
                role: membership.role as Role,
                organization: orgId.toString(),
            };

            next();
        } catch (error) {
            next(error);
        }
    };
};
