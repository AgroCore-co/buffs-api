import { Module } from '@nestjs/common';
import { AlertasConsumer } from './alertas.consumer';
import { AlertasModule } from '../alerta.module';
import { GeminiModule } from 'src/core/gemini/gemini.module';

/**
 * Módulo dos consumers RabbitMQ para alertas.
 *
 * Registra o AlertasConsumer que processa eventos `alerta_criado`
 * vindos da queue `buffs.alerts` configurada no main.ts (Hybrid App).
 */
@Module({
  imports: [AlertasModule, GeminiModule],
  controllers: [AlertasConsumer],
})
export class AlertsConsumerModule {}
