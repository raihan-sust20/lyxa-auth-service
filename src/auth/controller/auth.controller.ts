import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../service/auth.service';
import { RegisterDto, AuthResponseDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ValidateTokenDto, ValidateTokenResponseDto } from '../dto/validate-token.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LogoutDto, LogoutResponseDto } from '../dto/logout.dto';
import { LogGrpc } from '../../common/decorators/log-grpc.decorator';


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  @LogGrpc()
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(data);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: ValidateTokenDto): Promise<ValidateTokenResponseDto> {
    return this.authService.validateToken(data.accessToken);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(data.refreshToken);
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutDto): Promise<LogoutResponseDto> {
    const success = await this.authService.logout(data.userId);
    return { success };
  }
}
