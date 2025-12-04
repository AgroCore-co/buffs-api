import { Module } from '@nestjs/common';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { LoteRepositoryDrizzle } from './repositories';
import { PropriedadeRepositoryDrizzle } from '../propriedade/repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [LoteController],
  providers: [LoteService, LoteRepositoryDrizzle, PropriedadeRepositoryDrizzle],
  exports: [LoteService],
})
export class LoteModule {}
