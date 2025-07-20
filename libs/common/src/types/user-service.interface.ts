import { Types } from 'mongoose';

export interface IUserService {
  getUser(query: { _id: Types.ObjectId }): Promise<any>;
  validateUser(email: string, password: string): Promise<any>;
}
