import { Module } from '@nestjs/common';
import { AlertasConsumer } from './alertas.consumer';
import { AlertasProvidersModule } from '../alerta.providers.module';

/**
 * Módulo dos consumers RabbitMQ para alertas.
 *
 * Registra o AlertasConsumer que processa eventos `alerta_criado`
 * vindos da queue `buffs.alerts` configurada no main.ts (Hybrid App).
 */
@Module({
  imports: [AlertasProvidersModule],
  controllers: [AlertasConsumer],
})
export class AlertsConsumerModule {}
