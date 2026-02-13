import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PredicaoProducaoController } from './predicao-producao.controller';
import { PredicaoProducaoService } from './predicao-producao.service';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';

/**
 * Módulo responsável pela integração de predição de produção com IA.
 *
 * **Funcionalidades:**
 * - Predição individual de produção de leite
 * - Classificação de potencial produtivo
 * - Comparação com média da propriedade
 */
@Module({
  imports: [AuthModule, LoggerModule, HttpModule, ConfigModule, CacheModule.register()],
  controllers: [PredicaoProducaoController],
  providers: [PredicaoProducaoService],
  exports: [PredicaoProducaoService],
})
export class PredicaoProducaoModule {}
