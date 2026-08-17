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
    return await this.model.find({ organizationId: orgId }).populate('user', '-passwordHash');
  }

  async findByOrgAndUser(organizationId: string, userId: string) {
    return await this.model.findOne({ organizationId, userId })
      .populate('organizationId')
      .populate('userId')
      .lean();
  }
}

const membershipRepository = new MembershipRepository();
export default membershipRepository;