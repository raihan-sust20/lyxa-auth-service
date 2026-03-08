export class ValidateTokenRpcRequestDto {
  accessToken: string;
}

export class ValidateTokenRpcResponseDto {
  valid: boolean;
  userId?: string;
  email?: string;
}
