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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';

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
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('photographer')
  @Get('photographer-only')
  photographerOnly(@CurrentUser() user: AuthenticatedUser) {
    return { message: 'This route is only accessible to photographers', user };
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
}
