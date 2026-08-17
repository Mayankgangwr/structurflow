import { OrganizationModel, IOrganization } from '@/models/organization.model';
import { ClientSession } from 'mongoose';
import BaseRepository from './base.repository';

class OrganizationRepository extends BaseRepository<IOrganization> {
  constructor() {
    super(OrganizationModel)
  }

  async findBySlug(slug: string) {
    return await this.model.findOne({ slug });
  }
  
  async slugExists(slug: string) {
    const org = await this.model.findOne({ slug }).select('_id').lean();
    return org !== null;
  }
};

const organizationRepository = new OrganizationRepository();
export default organizationRepository;