export class ValidateTokenDto {
  accessToken!: string;
}

export class ValidateTokenResponseDto {
  valid!: boolean;
  userId?: string;
  email?: string;
}