import { Module } from '@nestjs/common';
import { CoberturaController } from './cobertura.controller';
import { CoberturaService } from './cobertura.service';
import { CoberturaValidatorDrizzle } from './validators/cobertura.validator.drizzle';
import { CoberturaRepositoryDrizzle } from './repositories/cobertura.repository';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AlertasModule } from 'src/modules/alerta/alerta.module';
import { LoggerModule } from 'src/core/logger/logger.module';
import { CacheConfigModule } from 'src/core/cache/cache.module';

/**
 * Módulo de coberturas com Clean Architecture usando Drizzle ORM.
 *
 * **Providers registrados:**
 * - CoberturaService (orquestrador de lógica de negócio)
 * - CoberturaRepositoryDrizzle (acesso a dados via Drizzle ORM)
 * - CoberturaValidatorDrizzle (validações zootécnicas e de negócio)
 *
 * **Otimizações:**
 * - Batch queries para reduzir N+1
 * - Cache de raças e estatísticas
 * - Transações para operações críticas
 */
@Module({
  imports: [DatabaseModule, AuthModule, AlertasModule, LoggerModule, CacheConfigModule],
  controllers: [CoberturaController],
  providers: [CoberturaService, CoberturaRepositoryDrizzle, CoberturaValidatorDrizzle],
})
export class CoberturaModule {}
