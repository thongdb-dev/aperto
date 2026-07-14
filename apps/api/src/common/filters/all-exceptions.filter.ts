import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.buildBody(status, exception));
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(this.buildBody(HttpStatus.INTERNAL_SERVER_ERROR));
  }

  private buildBody(
    status: HttpStatus,
    exception?: HttpException,
  ): ErrorResponseBody {
    return {
      success: false,
      error: {
        code: HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR',
        message: exception
          ? this.extractMessage(exception)
          : 'Đã có lỗi xảy ra, vui lòng thử lại sau',
      },
    };
  }

  private extractMessage(exception: HttpException): string {
    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      if (typeof message === 'string') {
        return message;
      }
    }
    return exception.message;
  }
}
