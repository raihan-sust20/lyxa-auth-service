import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;
}

export class AuthResponseDto {
  name!: string;
  userId!: string;
  email!: string;
  accessToken!: string;
  refreshToken!: string;
  accessTokenExpiresAt!: number;
  refreshTokenExpiresAt!: number;
}
