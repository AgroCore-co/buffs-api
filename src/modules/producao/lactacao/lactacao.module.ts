import { Module } from '@nestjs/common';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { AlertasModule } from '../../alerta/alerta.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { RebanhoModule } from '../../rebanho/rebanho.module';
import { GestaoPropriedadeModule } from '../../gestao-propriedade/gestao-propriedade.module';
import { LactacaoController } from './lactacao.controller';
import { LactacaoService } from './lactacao.service';
import { LactacaoRepositoryDrizzle } from './repositories';

@Module({
  imports: [LoggerModule, AuthModule, AlertasModule, DatabaseModule, RebanhoModule, GestaoPropriedadeModule],
  controllers: [LactacaoController],
  providers: [LactacaoService, LactacaoRepositoryDrizzle],
  exports: [LactacaoService, LactacaoRepositoryDrizzle],
})
export class LactacaoModule {}
