import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { isMongoServerError } from '../common/utils/mongo-error.util';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(dto: RegisterDto) {
    const password_hash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.userModel.create({
        email: dto.email,
        password_hash,
      });
      return { id: user._id, email: user.email };
    } catch (err) {
      if (isMongoServerError(err) && err.code === 11000) {
        if (err.code === 11000) {
          throw new ConflictException('Email đã được sử dụng');
        }
      }
      throw err;
    }
  }
}
