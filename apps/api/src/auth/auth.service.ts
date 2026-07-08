import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { isMongoServerError } from '../common/utils/mongo-error.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

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

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return null;
    }
    const match = await bcrypt.compare(password, user.password_hash);
    return match ? user : null;
  }

  login(user: UserDocument) {
    const payload = { sub: user._id.toString(), roles: user.roles };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
    return { accessToken };
  }
}
