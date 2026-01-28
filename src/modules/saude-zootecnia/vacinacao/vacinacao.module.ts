import { Module } from '@nestjs/common';
import { VacinacaoController } from './vacinacao.controller';
import { VacinacaoService } from './vacinacao.service';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { VacinacaoRepositoryDrizzle } from './repositories';
import { DadosSanitariosRepositoryDrizzle } from '../dados-sanitarios/repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [VacinacaoController],
  providers: [VacinacaoService, VacinacaoRepositoryDrizzle, DadosSanitariosRepositoryDrizzle],
})
export class VacinacaoModule {}
