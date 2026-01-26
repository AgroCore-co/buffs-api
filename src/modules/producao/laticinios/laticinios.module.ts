import { Module } from '@nestjs/common';
import { LaticiniosService } from './laticinios.service';
import { LaticiniosController } from './laticinios.controller';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { LaticiniosRepository } from './repositories';

@Module({
  imports: [LoggerModule, AuthModule, DatabaseModule],
  controllers: [LaticiniosController],
  providers: [LaticiniosService, LaticiniosRepository],
  exports: [LaticiniosService],
})
export class LaticiniosModule {}
