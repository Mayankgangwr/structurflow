import { Role } from '@/models/membership.model';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
      membership?: {
        _id: string;
        role: Role;
        organization: string;
      };
      token?: string;
    }
  }
}
