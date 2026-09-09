import auditLogRepository, { ActivityQueryOptions } from "@/repositories/audit-log.repository";
import { Role } from "@/models/membership.model";

class ActivityService {
    async getActivities(organizationId: string, options: ActivityQueryOptions, userRole?: Role) {
        const result = await auditLogRepository.findActivitiesByOrg(organizationId, options);

        // Sanitize sensitive networking info (like IP address) for non-admin viewers/reviewers
        const isPrivileged = userRole === Role.OWNER || userRole === Role.ADMIN;
        const sanitizedActivities = result.activities.map((act: any) => {
            if (!isPrivileged && act.ipAddress) {
                const { ipAddress, ...rest } = act;
                return rest;
            }
            return act;
        });

        return {
            activities: sanitizedActivities,
            pagination: result.pagination,
        };
    }

    async getActivityStats(organizationId: string) {
        return await auditLogRepository.getActivityStats(organizationId);
    }
}

const activityService = new ActivityService();
export default activityService;
