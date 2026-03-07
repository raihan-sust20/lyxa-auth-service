import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { DomainException, DomainExceptionCode } from './domain.exception';

@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);
  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    if (exception instanceof DomainException) {
      return throwError(
        () =>
          new RpcException({
            code: this.mapToGrpcStatus(exception.code),
            message: exception.message,
          }),
      );
    }

    if (exception instanceof RpcException) {
      this.logger.error(`RPC Exception: ${exception.message}`);
      this.logger.error(exception?.stack);
      return throwError(() => exception);
    }

    this.logger.error(`Internal Error: ${exception}`);
    // Fallback: unknown internal error
    return throwError(
      () =>
        new RpcException({
          code: status.INTERNAL,
          message: 'Internal server error',
        }),
    );
  }

  private mapToGrpcStatus(code: DomainExceptionCode): status {
    const map: Record<DomainExceptionCode, status> = {
      [DomainExceptionCode.NOT_FOUND]: status.NOT_FOUND,
      [DomainExceptionCode.CONFLICT]: status.ALREADY_EXISTS,
      [DomainExceptionCode.UNAUTHORIZED]: status.UNAUTHENTICATED,
      [DomainExceptionCode.FORBIDDEN]: status.PERMISSION_DENIED,
      [DomainExceptionCode.VALIDATION]: status.INVALID_ARGUMENT,
      [DomainExceptionCode.INTERNAL]: status.INTERNAL,
    };
    return map[code] ?? status.INTERNAL;
  }
}
