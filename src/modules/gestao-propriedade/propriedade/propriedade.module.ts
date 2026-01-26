import { Module } from '@nestjs/common';
import { PropriedadeController } from './propriedade.controller';
import { PropriedadeService } from './propriedade.service';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { PropriedadeRepositoryDrizzle } from './repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [PropriedadeController],
  providers: [PropriedadeService, PropriedadeRepositoryDrizzle],
  exports: [PropriedadeService, PropriedadeRepositoryDrizzle],
})
export class PropriedadeModule {}
