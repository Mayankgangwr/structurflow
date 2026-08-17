import { UserModel, IUser } from '@/models/user.model';
import { ClientSession } from 'mongoose';
import BaseRepository from './base.repository';

class UserRepository extends BaseRepository<IUser> {
  constructor(){
    super(UserModel)
  }

  async findByEmail(email: string){
    return await this.model.findOne({ email });
  } 

  async findByEmailForAuth(email: string){
    return await this.model.findOne({ email }).select('+passwordHash'); 
  } 

  async findById(id: string){
    return await this.model.findById(id).select('-passwordHash');
  }

  async emailExists(email: string) {
    const user = await this.model.findOne({ email }).select('_id').lean();
    return user !== null;
  }
};

const userRepository =  new UserRepository()
export default userRepository;
