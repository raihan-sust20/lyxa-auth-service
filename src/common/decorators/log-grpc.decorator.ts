import { Logger } from '@nestjs/common';

/**
 * Method decorator that automatically logs incoming gRPC calls
 * and outgoing responses (or errors) with timing.
 */
export function LogGrpc(): MethodDecorator {
  return (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const logger = new Logger('gRPC');

    descriptor.value = async function (...args: unknown[]) {
      const start = Date.now();
      logger.log(`→ ${methodName} called`);

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        logger.log(`← ${methodName} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(
          `← ${methodName} failed in ${duration}ms: ${(error as Error).message}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
