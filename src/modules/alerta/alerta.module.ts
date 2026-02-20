import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AlertasService } from './alerta.service';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { GeminiModule } from 'src/core/gemini/gemini.module';
import { DatabaseModule } from 'src/core/database/database.module';
import { RabbitMQModule } from 'src/core/rabbitmq/rabbitmq.module';
import { RabbitMQConfig } from 'src/core/rabbitmq/rabbitmq.constants';

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

// RabbitMQ específico de alertas
import { AlertsRabbitMQService } from './rabbitmq/alerts-rabbitmq.service';

// Consumer
import { AlertaConsumer } from './consumers/alerta.consumer';

@Module({
  imports: [
    GeminiModule,
    DatabaseModule,
    RabbitMQModule,
    ConfigModule,
    // Configuração minimalista do RabbitMQ para consumers
    GolevelupRabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
        exchanges: [
          {
            name: RabbitMQConfig.EXCHANGE,
            type: 'topic',
          },
        ],
      }),
    }),
  ],
  controllers: [AlertasController],
  providers: [
    // Core service
    AlertasService,

    // Scheduler
    AlertasScheduler,

    // RabbitMQ
    AlertsRabbitMQService,

    // Consumer
    AlertaConsumer,

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
  exports: [AlertasService, AlertsRabbitMQService],
})
export class AlertasModule {}
