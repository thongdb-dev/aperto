import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { createHash, randomInt, randomUUID } from 'crypto';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { EmailService } from 'src/email/email.service';
import { TooManyRequestsException } from '../common/exceptions/too-many-requests.exception';
import { isMongoServerError } from '../common/utils/mongo-error.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
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
        throw new ConflictException('Email đã được sử dụng');
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

  private signAccess(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      roles: user.roles,
      status: user.status,
    };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
  }

  async login(user: UserDocument) {
    const tokenId = randomUUID();
    const accessToken = this.signAccess(user);
    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), tokenId },
      { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );

    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.redis.set(
      `refresh:${user._id.toString()}:${tokenId}`,
      hash,
      'EX',
      7 * 24 * 60 * 60,
    ); // 7 days in seconds

    return { accessToken, refreshToken };
  }

  async refresh(token: string) {
    let payload: { sub: string; tokenId: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const key = `refresh:${payload.sub}:${payload.tokenId}`;
    const storedHash = await this.redis.get(key);
    const incomingHash = createHash('sha256').update(token).digest('hex');

    if (!storedHash || storedHash !== incomingHash) {
      const staleKeys = await this.redis.keys(`refresh:${payload.sub}:*`);
      if (staleKeys.length > 0) {
        await this.redis.del(...staleKeys);
      }
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    await this.redis.del(key);
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    return this.login(user);
  }

  logout(userId: string, refreshToken: string) {
    const payload = this.jwtService.decode<{ tokenId: string } | null>(
      refreshToken,
    );
    if (!payload?.tokenId) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    return this.redis.del(`refresh:${userId}:${payload.tokenId}`);
  }

  async verifyOtp(userId: string, code: string) {
    const key = `otp:${userId}`;
    const attemptsKey = `otp_attempts:${userId}`;
    const attempts = parseInt((await this.redis.get(attemptsKey)) ?? '0', 10);
    if (attempts === 1) {
      await this.redis.expire(attemptsKey, 600);
    }
    if (attempts > 5) {
      throw new TooManyRequestsException('Quá số lần thử, yêu cầu OTP mới');
    }

    const stored = await this.redis.get(key);
    if (!stored || stored !== code) {
      throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
    }

    await this.redis.del(key, attemptsKey);
    return true;
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async sendOtp(user: UserDocument) {
    const code = this.generateOtp();
    await this.redis.set(`otp:${user._id.toString()}`, code, 'EX', 600);
    await this.emailService.sendOtpEmail(user.email, code);
  }

  async requestOtp(userId: string) {
    const coolDownKey = `otp_cool_down:${userId}`;
    if (await this.redis.exists(coolDownKey)) {
      throw new BadRequestException(
        'Vui lòng đợi 1 phút trước khi yêu cầu mã mới',
      );
    }
    await this.redis.set(coolDownKey, '1', 'EX', 60);

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.sendOtp(user);
  }
}
