import {
  Controller,
  Body,
  Post,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { VerifiedGuard } from './guards/verified.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RequireVerified } from './decorators/require-verified.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer')
  @Get('photographer-only')
  photographerOnly(@CurrentUser() user: AuthenticatedUser) {
    return { message: 'This route is only accessible to photographers', user };
  }

  // Demo cho VerifiedGuard: tài khoản `pending_verification` vẫn login được bình thường,
  // nhưng bị chặn ở những route có @RequireVerified() cho tới khi xác thực OTP.
  @UseGuards(JwtAuthGuard, VerifiedGuard)
  @RequireVerified()
  @Get('verified-only')
  verifiedOnly(@CurrentUser() user: AuthenticatedUser) {
    return { message: 'This route requires a verified account', user };
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body('refreshToken') token: string,
  ) {
    await this.authService.logout(user.userId, token);
    return { message: 'Đã đăng xuất' };
  }

  @Post('resend-otp')
  resendOtp(@Body('userId') userId: string) {
    return this.authService.requestOtp(userId);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.userId, dto.code);
  }
}
