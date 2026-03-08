import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { LoggerService } from '../../common/logger/logger.service';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  timestamp: string;
}

@Injectable()
export class UserRegisteredEvent {
  private readonly EXCHANGE = 'auth.events';
  private readonly ROUTING_KEY = 'user.registered';

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly logger: LoggerService,
  ) {}

  async publish(payload: UserRegisteredPayload): Promise<void> {
    this.logger.log(
      `Publishing event [${this.ROUTING_KEY}] for userId=${payload.userId}`,
      'UserRegisteredEvent',
    );

    await this.amqpConnection.publish(this.EXCHANGE, this.ROUTING_KEY, payload);
  }
}
