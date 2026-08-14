import { redis } from "@/config/redis";
import { Role } from "@/models/membership.model";
import { MembershipRepository } from "@/repositories/membership.repository";
import { OrganizationRepository } from "@/repositories/organization.repository";
import { UserRepository } from "@/repositories/user.repository";
import { parseDurationToMs } from "@/utils/cookie";
import { ApiErrors } from "@/utils/errors";
import { generateToken } from "@/utils/generate";
import { mailService } from "./mail.service";

class TeamService {

    async inviateMamber(inviterUserId: string, email: string, role: Role, organizationId: string) {
        // 1. Validate inviter has permission (must be OWNER or ADMIN)
        const inviterMembership = await MembershipRepository.findByOrgAndUser(organizationId, inviterUserId);
        if (!inviterMembership || !['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        // 2. Check if user is already in the org
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            const alreadyMember = await MembershipRepository.findByOrgAndUser(organizationId, existingUser._id.toString());

            if (alreadyMember) throw ApiErrors.duplicateMembership();
        }

        // 3. Generate secure invite token
        const inviteToken: string = generateToken(32);

        // 4. Save invite intent in Redis (Expires in 3 days)
        const inviateData = {
            email,
            organizationId,
            role,
            inviterId: inviterUserId
        };

        await redis.setJson(`org_invite:${inviteToken}`, inviateData, parseDurationToMs('3d'));

        //  5. Send Email
        const inviter = await UserRepository.findById(inviterUserId);
        const org = await OrganizationRepository.findById(organizationId);
        await mailService.sendTeamInviteEmail(email, inviter!.firstName, org!.name, inviteToken);
    }
};

const teamService = new TeamService();
export default teamService;