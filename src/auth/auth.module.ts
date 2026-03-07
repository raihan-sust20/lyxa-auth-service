import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { AuthRepository } from './repository/auth.repository';
import { User, UserModel } from './model/user.model';
// import { UserRegisteredEvent } from './events/user-registered.event';
import { CommonModule } from '../common/common.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserModel.schema }]),
    JwtModule.register({}),
    // RabbitMQModule.forRootAsync(RabbitMQModule, {
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     exchanges: [
    //       {
    //         name: 'auth.events',
    //         type: 'topic',
    //       },
    //     ],
    //     uri: config.get<string>('rabbitmq.url')!,
    //     connectionInitOptions: { wait: false },
    //   }),
    // }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, /*UserRegisteredEvent*/],
})
export class AuthModule {}
