import { Controller } from '@nestjs/common';
import { RabbitRPC, Nack } from '@golevelup/nestjs-rabbitmq';
import { AuthService } from '../service/auth.service';
import { LoggerService } from '../../common/logger/logger.service';
import {
  ValidateTokenRpcRequestDto,
  ValidateTokenRpcResponseDto,
} from '../dto/validate-token-rpc.dto';

const RPC_ROUTING_KEY = 'auth.validate_token';
const RPC_QUEUE = 'auth.validate_token_queue';
const RPC_EXCHANGE = 'auth.rpc';
const DLX_EXCHANGE = 'auth.rpc.dlx';

/**
 * Handles RabbitMQ RPC requests from other microservices for JWT validation.
 *
 * Exchange : auth.rpc              (direct)
 * Queue    : auth.validate_token   → DLX: auth.rpc.dlx / auth.validate_token.dead
 * Routing  : auth.validate_token
 */
@Controller()
export class AuthRpcController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {}

  @RabbitRPC({
    exchange: RPC_EXCHANGE,
    routingKey: RPC_ROUTING_KEY,
    queue: RPC_QUEUE,
    createQueueIfNotExists: true,
    queueOptions: {
      durable: true,
      // ── 1. Dead-letter routing 
      arguments: {
        'x-dead-letter-exchange': DLX_EXCHANGE,
        'x-dead-letter-routing-key': `${RPC_QUEUE}.dead`,
        // ── 4. Limit queue depth to avoid memory pressure 
        'x-max-length': 10_000,
        'x-overflow': 'reject-publish',
      },
    },
    // Do NOT auto-ack on error — nack without requeue so message goes to DLX
    errorHandler: (channel, msg, error) => {
      channel.nack(msg, false, false);
    },
  })
  async validateToken(
    request: ValidateTokenRpcRequestDto,
  ): Promise<ValidateTokenRpcResponseDto | Nack> {
    const start = Date.now();

    // ── 3. Structured log: request received ───────────────────────────────
    this.logger.log(
      `[RPC] validate_token ← request received`,
      'AuthRpcController',
    );

    // ── 2. Security: reject structurally invalid payloads ─────────────────
    //    Malformed messages are nacked without requeue → routed to DLX.
    if (!request?.accessToken || typeof request.accessToken !== 'string') {
      this.logger.warn(
        `[RPC] validate_token — malformed payload, routing to DLX`,
        'AuthRpcController',
      );
      return new Nack(false);
    }

    // ── 2. Security: structural JWT check before hitting JwtService ────────
    //    A valid JWT is always three base64url segments separated by dots.
    //    Full cryptographic verification is done inside AuthService.
    if (!this.hasValidJwtStructure(request.accessToken)) {
      this.logger.warn(
        `[RPC] validate_token — token fails structural check`,
        'AuthRpcController',
      );
      // The request was well-formed; return a negative business response.
      return { valid: false };
    }

    try {
      const result = await this.authService.validateToken(request.accessToken);
      const duration = Date.now() - start;

      // ── 3. Structured log: outcome + timing ─────────────────────────────
      this.logger.log(
        `[RPC] validate_token → valid=${result.valid} userId=${result.userId ?? 'n/a'} duration=${duration}ms`,
        'AuthRpcController',
      );

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      // ── 1. Unexpected error → nack without requeue → DLX ───────────────
      //    Never requeue to avoid poison-message loops.
      this.logger.error(
        `[RPC] validate_token — unexpected error after ${duration}ms: ${(error as Error).message}`,
        (error as Error).stack,
        'AuthRpcController',
      );

      return new Nack(false);
    }
  }

  // ── 2. Security helper ─────────────────────────────────────────────────────
  private hasValidJwtStructure(token: string): boolean {
    console.log('Token structure check:', token);
    const parts = token.split('.');
    return parts.length === 3 && parts.every((p) => p.length > 0);
  }
}
