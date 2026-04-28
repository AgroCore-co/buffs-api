import { Module } from '@nestjs/common';
import { AlimentacaoDefController } from './alimentacao-def.controller';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { AlimentacaoDefRepositoryDrizzle } from './repositories/alimentacao-def.repository.drizzle';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { CoreModule } from '../../../core/core.module';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule, CoreModule],
  controllers: [AlimentacaoDefController],
  providers: [AlimentacaoDefService, AlimentacaoDefRepositoryDrizzle],
  exports: [AlimentacaoDefService],
})
export class AlimentacaoDefModule {}
