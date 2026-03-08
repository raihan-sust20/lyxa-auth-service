import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './controller/auth.controller';
import { AuthRpcController } from './controller/auth-rpc.controller';
import { AuthService } from './service/auth.service';
import { AuthRepository } from './repository/auth.repository';
import { User, UserModel } from './model/user.model';
import { UserRegisteredEvent } from './events/user-registered.event';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserModel.schema }]),
    JwtModule.register({}),
    MessageModule
  ],
  controllers: [AuthController, AuthRpcController],
  providers: [AuthService, AuthRepository, UserRegisteredEvent],
})
export class AuthModule {}
