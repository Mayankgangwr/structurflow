import { MembershipModel, IMembership, Role } from '@/models/membership.model';
import { ClientSession } from 'mongoose';
import BaseRepository from './base.repository';

class MembershipRepository extends BaseRepository<IMembership> {
  constructor() {
    super(MembershipModel);
  }

  async findByUserAndOrg(userId: string, orgId: string) {
    return await this.model.findOne({ userId, organizationId: orgId })
  }

  async findAllByUser(userId: string) {
    return await this.model.find({ userId }).populate('organizationId').lean();
  }

  async findAllByOrg(orgId: string) {
    return await this.model
      .find({ organizationId: orgId })
      .populate('userId', 'firstName lastName email avatar createdAt lastLoginAt')
      .sort({ createdAt: 1 })
      .lean();
  }

  async findByOrgAndUser(organizationId: string, userId: string) {
    return await this.model.findOne({ organizationId, userId })
      .populate('organizationId')
      .populate('userId', 'firstName lastName email avatar')
      .lean();
  }

  async updateRole(organizationId: string, userId: string, role: Role) {
    return await this.model.findOneAndUpdate(
      { organizationId, userId },
      { role },
      { new: true }
    ).populate('userId', 'firstName lastName email avatar').lean();
  }

  async deleteByOrgAndUser(organizationId: string, userId: string) {
    return await this.model.findOneAndDelete({ organizationId, userId }).exec();
  }

  async countByOrgAndRole(organizationId: string, role: Role): Promise<number> {
    return await this.model.countDocuments({ organizationId, role });
  }
}

const membershipRepository = new MembershipRepository();
export default membershipRepository;