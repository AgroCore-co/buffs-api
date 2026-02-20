import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService, RabbitMQConfig } from 'src/core/rabbitmq';
import { AlertsQueues, AlertsRoutingKeys, AlertsRabbitMQConfig } from './alerts-rabbitmq.constants';
import { ConsumeMessage } from 'amqplib';

/**
 * Interface para mensagens de alerta
 */
export interface AlertMessage {
  id_alerta: string;
  nicho: string;
  prioridade?: string;
  titulo: string;
  descricao?: string;
  data_ocorrencia: string;
  [key: string]: unknown;
}

/**
 * Serviço específico para gerenciar mensagens de alertas via RabbitMQ.
 * Wrapper do RabbitMQService genérico com funcionalidades específicas de alertas.
 */
@Injectable()
export class AlertsRabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(AlertsRabbitMQService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit() {
    // Configurar infraestrutura específica de alertas
    await this.setupAlertsInfrastructure();
  }

  /**
   * Configura queues, bindings e DLQ específicos para alertas
   */
  private async setupAlertsInfrastructure(): Promise<void> {
    try {
      // 1. Criar Dead Letter Queue
      await this.rabbitMQService.assertQueue(AlertsQueues.DEAD_LETTER, {
        durable: true,
      });

      // 2. Bind DLQ ao DLX
      await this.rabbitMQService.bindQueue(
        AlertsQueues.DEAD_LETTER,
        '#', // Captura todas as mensagens mortas
      );

      // 3. Criar queue de notificações com DLX configurado
      await this.rabbitMQService.assertQueue(AlertsQueues.NOTIFICATIONS, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RabbitMQConfig.DLX_EXCHANGE,
          'x-message-ttl': AlertsRabbitMQConfig.MESSAGE_TTL,
        },
      });

      // 4. Criar queue de IA com DLX configurado
      await this.rabbitMQService.assertQueue(AlertsQueues.AI_PROCESSING, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RabbitMQConfig.DLX_EXCHANGE,
          'x-message-ttl': AlertsRabbitMQConfig.MESSAGE_TTL,
        },
      });

      // 5. Bind queues ao exchange principal
      await this.rabbitMQService.bindQueue(AlertsQueues.NOTIFICATIONS, AlertsRoutingKeys.ALL);
      await this.rabbitMQService.bindQueue(AlertsQueues.AI_PROCESSING, AlertsRoutingKeys.ALL);

      this.logger.log('📦 Infraestrutura de alertas configurada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao configurar infraestrutura de alertas:', error);
      // Não lançar erro - sistema deve funcionar sem RabbitMQ
    }
  }

  /**
   * Publica um alerta no RabbitMQ
   */
  async publishAlert(alertData: AlertMessage): Promise<boolean> {
    const routingKey = AlertsRoutingKeys.generate(alertData.nicho ?? 'GERAL', alertData.prioridade ?? 'MEDIA');

    const published = await this.rabbitMQService.publish(routingKey, alertData);

    if (published) {
      this.logger.log(`📤 Alerta publicado [${routingKey}]: ${alertData.id_alerta}`);
    }

    return published;
  }

  /**
   * Registra um consumer para processar notificações de alertas
   */
  async consumeNotifications(handler: (message: AlertMessage, rawMessage: ConsumeMessage) => Promise<void>): Promise<void> {
    await this.rabbitMQService.consume<AlertMessage>(AlertsQueues.NOTIFICATIONS, handler, { prefetch: AlertsRabbitMQConfig.PREFETCH });

    this.logger.log('👂 Consumer de notificações registrado');
  }

  /**
   * Registra um consumer para processamento de IA
   */
  async consumeAIProcessing(handler: (message: AlertMessage, rawMessage: ConsumeMessage) => Promise<void>): Promise<void> {
    await this.rabbitMQService.consume<AlertMessage>(AlertsQueues.AI_PROCESSING, handler, { prefetch: AlertsRabbitMQConfig.PREFETCH });

    this.logger.log('👂 Consumer de processamento IA registrado');
  }

  /**
   * Obtém estatísticas das queues de alertas
   */
  async getQueuesStats() {
    return {
      notifications: await this.rabbitMQService.getQueueStats(AlertsQueues.NOTIFICATIONS),
      aiProcessing: await this.rabbitMQService.getQueueStats(AlertsQueues.AI_PROCESSING),
      deadLetter: await this.rabbitMQService.getQueueStats(AlertsQueues.DEAD_LETTER),
    };
  }
}
