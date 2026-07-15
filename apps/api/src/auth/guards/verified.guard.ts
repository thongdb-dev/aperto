import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { REQUIRE_VERIFIED_KEY } from '../decorators/require-verified.decorator';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const require = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_VERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!require) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (user?.status !== 'active') {
      throw new ForbiddenException(
        'Cần xác thực email trước khi thực hiện thao tác này',
      );
    }
    return true;
  }
}
