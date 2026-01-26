import { Module } from '@nestjs/common';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { GeminiModule } from 'src/core/gemini/gemini.module';
import { DatabaseModule } from 'src/core/database/database.module';

// Drizzle Repositories
import { AlertaRepositoryDrizzle } from './repositories/alerta.repository.drizzle';
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { ReproducaoRepositoryDrizzle } from './repositories/reproducao.repository.drizzle';
import { SanitarioRepositoryDrizzle } from './repositories/sanitario.repository.drizzle';
import { ProducaoRepositoryDrizzle } from './repositories/producao.repository.drizzle';

// Domain Services
import { AlertaReproducaoService } from './services/alerta-reproducao.service';
import { AlertaSanitarioService } from './services/alerta-sanitario.service';
import { AlertaProducaoService } from './services/alerta-producao.service';
import { AlertaManejoService } from './services/alerta-manejo.service';
import { AlertaClinicoService } from './services/alerta-clinico.service';

@Module({
  imports: [GeminiModule, DatabaseModule],
  controllers: [AlertasController],
  providers: [
    // Core service
    AlertasService,

    // Scheduler
    AlertasScheduler,

    // Drizzle Repositories
    AlertaRepositoryDrizzle,
    BufaloRepositoryDrizzle,
    ReproducaoRepositoryDrizzle,
    SanitarioRepositoryDrizzle,
    ProducaoRepositoryDrizzle,

    // Domain services
    AlertaReproducaoService,
    AlertaSanitarioService,
    AlertaProducaoService,
    AlertaManejoService,
    AlertaClinicoService,
  ],
  exports: [AlertasService],
})
export class AlertasModule {}
