import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { MessageModule } from '../message/message.module';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonModule {}
