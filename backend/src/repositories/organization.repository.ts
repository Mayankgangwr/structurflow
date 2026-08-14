import { Organization, IOrganization } from '@/models/organization.model';
import { ClientSession } from 'mongoose';

export const OrganizationRepository = {
  findById: (id: string) => Organization.findById(id),

  findBySlug: (slug: string) => Organization.findOne({ slug }),

  create: async (data: Partial<IOrganization>, session?: ClientSession) => {
    const [org] = await Organization.create([data], { session });
    return org;
  },

  slugExists: async (slug: string): Promise<boolean> => {
    const org = await Organization.findOne({ slug }).select('_id').lean();
    return org !== null;
  },
};
