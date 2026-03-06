export enum DomainExceptionCode {
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION = 'VALIDATION',
  INTERNAL = 'INTERNAL',
}

export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: DomainExceptionCode,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
