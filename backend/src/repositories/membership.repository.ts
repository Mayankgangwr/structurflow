import { Membership, IMembership, Role } from '@/models/membership.model';
import { ClientSession } from 'mongoose';

export const MembershipRepository = {
  create: async (data: Partial<IMembership>, session?: ClientSession) => {
    const [membership] = await Membership.create([data], { session });
    return membership;
  },

  findByUserAndOrg: (userId: string, orgId: string) =>
    Membership.findOne({ user: userId, organization: orgId }),

  findAllByUser: async (userId: string) => {
    return Membership.find({ userId })
      .populate('organizationId')
      .lean();
  },

  findAllByOrg: (orgId: string) =>
    Membership.find({ organization: orgId }).populate('user', '-passwordHash'),

  findByOrgAndUser: async (organizationId: string, userId: string) => {
    return Membership.findOne({ organizationId, userId })
      .populate('organizationId')
      .populate('userId')
      .lean();
  },

};
