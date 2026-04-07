import { Module } from '@nestjs/common';
import { LoteController } from './lote.controller';
import { LoteService } from './lote.service';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { LoteRepositoryDrizzle } from './repositories';
import { GrupoModule } from '../../rebanho/grupo/grupo.module';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule, GrupoModule],
  controllers: [LoteController],
  providers: [LoteService, LoteRepositoryDrizzle],
  exports: [LoteService],
})
export class LoteModule {}
