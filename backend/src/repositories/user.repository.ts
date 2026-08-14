import { User, IUser } from '@/models/user.model';
import { ClientSession } from 'mongoose';

export const UserRepository = {
  findByEmail: (email: string) => User.findOne({ email }),

  findByEmailForAuth: (email: string) => User.findOne({ email }).select('+passwordHash'),

  findById: (id: string) => User.findById(id).select('-passwordHash'),

  create: async (data: Partial<IUser>, session?: ClientSession) => {
    const [user] = await User.create([data], { session });
    return user;
  },

  emailExists: async (email: string): Promise<boolean> => {
    const user = await User.findOne({ email }).select('_id').lean();
    return user !== null;
  },

  update: (id: string, data: Partial<IUser>) => User.findByIdAndUpdate(id, data, { new: true }),
};
