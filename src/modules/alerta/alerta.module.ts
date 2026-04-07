import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { GeminiModule } from 'src/core/gemini/gemini.module';
import { DatabaseModule } from 'src/core/database/database.module';
import { RabbitMQModule } from 'src/core/rabbitmq/rabbitmq.module';

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
import { AlertasVerificacaoService } from './services/alertas-verificacao.service';

@Module({
  imports: [
    GeminiModule,
    DatabaseModule,
    RabbitMQModule, // fornece RABBITMQ_SERVICE (ClientProxy)
    ConfigModule,
  ],
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
    AlertasVerificacaoService,
  ],
  exports: [AlertasService, AlertaRepositoryDrizzle],
})
export class AlertasModule {}
