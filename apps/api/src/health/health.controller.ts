import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

type DependencyStatus = 'up' | 'down';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const mongo: DependencyStatus =
      this.mongoConnection.readyState === ConnectionStates.connected
        ? 'up'
        : 'down';

    let redis: DependencyStatus = 'down';
    try {
      redis = (await this.redis.ping()) === 'PONG' ? 'up' : 'down';
    } catch {
      redis = 'down';
    }

    const body = {
      status: mongo === 'up' && redis === 'up' ? 'ok' : 'degraded',
      dependencies: { mongo, redis },
      timestamp: new Date().toISOString(),
    };

    if (body.status !== 'ok') {
      throw new ServiceUnavailableException(
        `Hệ thống đang gặp sự cố (mongo: ${mongo}, redis: ${redis})`,
      );
    }
    return body;
  }
}
