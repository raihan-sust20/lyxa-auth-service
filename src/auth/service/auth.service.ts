import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../repository/auth.repository';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { LoggerService } from '../../common/logger/logger.service';
import {
  DomainException,
  DomainExceptionCode,
} from '../../common/exceptions/domain.exception';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/register.dto';
import type { ValidateTokenResponseDto } from '../dto/validate-token.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRegisteredEvent: UserRegisteredEvent,
    private readonly logger: LoggerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering user: ${dto.email}`, 'AuthService');

    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new DomainException(
        'Email already in use',
        DomainExceptionCode.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const user = await this.authRepository.createUser(
      dto.name,
      dto.email,
      passwordHash,
    );

    const userId = (user as any)._id.toString();
    const { name, email } = user;
    const tokens = await this.generateAndStoreTokens(userId, user.email);

    await this.userRegisteredEvent.publish({
      userId,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User registered successfully: ${userId}`, 'AuthService');

    return { name, userId, email: email, ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for: ${dto.email}`, 'AuthService');

    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new DomainException(
        'Invalid credentials',
        DomainExceptionCode.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new DomainException(
        'Account is deactivated',
        DomainExceptionCode.FORBIDDEN,
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new DomainException(
        'Invalid credentials',
        DomainExceptionCode.UNAUTHORIZED,
      );
    }

    const userId = (user as any)._id.toString();
    const { name, email } = user;
    const tokens = await this.generateAndStoreTokens(userId, user.email);

    this.logger.log(`User logged in: ${userId}`, 'AuthService');

    return { name, userId, email: email, ...tokens };
  }

  async validateToken(accessToken: string): Promise<ValidateTokenResponseDto> {
    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      return { valid: true, userId: payload.sub, email: payload.email };
    } catch {
      return { valid: false };
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new DomainException(
        'Invalid or expired refresh token',
        DomainExceptionCode.UNAUTHORIZED,
      );
    }

    const user = await this.authRepository.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new DomainException(
        'Refresh token not found',
        DomainExceptionCode.UNAUTHORIZED,
      );
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatch) {
      throw new DomainException(
        'Refresh token mismatch',
        DomainExceptionCode.UNAUTHORIZED,
      );
    }

    const userId = (user as any)._id.toString();
    const { name, email } = user;
    const tokens = await this.generateAndStoreTokens(userId, user.email);

    return { name, userId, email: email, ...tokens };
  }

  async logout(userId: string): Promise<boolean> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new DomainException(
        'User not found',
        DomainExceptionCode.NOT_FOUND,
      );
    }

    await this.authRepository.updateRefreshToken(userId, null, null);
    this.logger.log(`User logged out: ${userId}`, 'AuthService');

    return true;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async generateAndStoreTokens(
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const accessExpiresIn = this.configService.get<number>(
      'jwt.accessExpiresIn',
    ) as number;
    const refreshExpiresIn = this.configService.get<number>(
      'jwt.refreshExpiresIn',
    ) as number;

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshExpiresIn * 1000,
    );

    await this.authRepository.updateRefreshToken(
      userId,
      refreshTokenHash,
      refreshTokenExpiresAt,
    );

    const now = Math.floor(Date.now() / 1000);
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: now + accessExpiresIn,
      refreshTokenExpiresAt: now + refreshExpiresIn,
    };
  }
}
