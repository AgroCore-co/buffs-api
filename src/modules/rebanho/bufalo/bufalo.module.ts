import { Module } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloController } from './bufalo.controller';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { GenealogiaModule } from '../../reproducao/genealogia/genealogia.module';
import { CoreModule } from '../../../core/core.module';
import { DatabaseModule } from '../../../core/database/database.module';

// Repositories e services
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from './repositories/usuario-propriedade.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';
import { BufaloScheduler } from './bufalo.scheduler';

/**
 * Módulo de búfalos com Clean Architecture e Drizzle ORM.
 *
 * **Providers registrados:**
 * - BufaloService (orquestrador)
 * - BufaloRepositoryDrizzle (acesso a dados via Drizzle)
 * - UsuarioPropriedadeRepositoryDrizzle (operações de usuário e propriedade)
 * - BufaloMaturidadeService (lógica de maturidade)
 * - BufaloCategoriaService (lógica de categoria ABCB)
 * - BufaloFiltrosService (lógica de filtros unificados)
 * - BufaloScheduler (tarefas agendadas)
 */
@Module({
  imports: [LoggerModule, AuthModule, GenealogiaModule, CoreModule, DatabaseModule],
  controllers: [BufaloController],
  providers: [
    BufaloService,
    BufaloRepositoryDrizzle,
    UsuarioPropriedadeRepositoryDrizzle,
    BufaloMaturidadeService,
    BufaloCategoriaService,
    BufaloFiltrosService,
    BufaloScheduler,
  ],
  exports: [BufaloService, BufaloRepositoryDrizzle, BufaloMaturidadeService, BufaloCategoriaService, BufaloFiltrosService],
})
export class BufaloModule {}
