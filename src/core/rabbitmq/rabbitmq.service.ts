import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConfig, RabbitMQQueues, RabbitMQRoutingKeys, RabbitMQRetryConfig } from './rabbitmq.constants';

export interface AlertMessage {
  id_alerta: string;
  nicho: string;
  prioridade?: string;
  titulo: string;
  descricao?: string;
  data_ocorrencia: string;
  [key: string]: any;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672');

    try {
      this.logger.log('Inicializando conexão com RabbitMQ...');

      // Criar conexão gerenciada
      this.connection = amqp.connect([rabbitmqUrl], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 5,
      });

      // Event listeners da conexão
      this.connection.on('connect', () => {
        this.isConnected = true;
        this.logger.log('✅ Conectado ao RabbitMQ com sucesso');
      });

      this.connection.on('disconnect', (err) => {
        this.isConnected = false;
        this.logger.warn('⚠️ Desconectado do RabbitMQ', err?.err?.message);
      });

      this.connection.on('connectFailed', (err) => {
        this.logger.error('❌ Falha ao conectar no RabbitMQ', err?.err?.message);
      });

      // Criar channel wrapper
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: Channel) => {
          await this.setupInfrastructure(channel);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('🚀 RabbitMQ inicializado e pronto para uso');
    } catch (error) {
      this.logger.error('❌ Erro crítico ao inicializar RabbitMQ:', error.message);
      // NÃO lançar erro - sistema deve funcionar sem RabbitMQ
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Fechando conexão com RabbitMQ...');
      await this.channelWrapper?.close();
      await this.connection?.close();
      this.logger.log('✅ Conexão com RabbitMQ fechada');
    } catch (error) {
      this.logger.error('Erro ao fechar conexão:', error.message);
    }
  }

  /**
   * Configura exchanges, queues e bindings
   */
  private async setupInfrastructure(channel: Channel): Promise<void> {
    try {
      // 1. Criar exchange principal
      await channel.assertExchange(RabbitMQConfig.EXCHANGE, RabbitMQConfig.EXCHANGE_TYPE, {
        durable: RabbitMQConfig.DURABLE,
      });

      // 2. Criar exchange DLX (Dead Letter Exchange)
      await channel.assertExchange(RabbitMQConfig.DLX_EXCHANGE, RabbitMQConfig.EXCHANGE_TYPE, {
        durable: RabbitMQConfig.DURABLE,
      });

      // 3. Criar Dead Letter Queue
      await channel.assertQueue(RabbitMQQueues.DEAD_LETTER, {
        durable: true,
      });

      // 4. Bind DLQ ao DLX
      await channel.bindQueue(RabbitMQQueues.DEAD_LETTER, RabbitMQConfig.DLX_EXCHANGE, '#');

      // 5. Criar queue de notificações com DLX configurado
      await channel.assertQueue(RabbitMQQueues.ALERTS_NOTIFICATIONS, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RabbitMQConfig.DLX_EXCHANGE,
          'x-message-ttl': RabbitMQRetryConfig.MESSAGE_TTL,
        },
      });

      // 6. Criar queue de IA com DLX configurado
      await channel.assertQueue(RabbitMQQueues.ALERTS_AI, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RabbitMQConfig.DLX_EXCHANGE,
          'x-message-ttl': RabbitMQRetryConfig.MESSAGE_TTL,
        },
      });

      // 7. Bind queues ao exchange principal (escutam todos os alertas)
      await channel.bindQueue(RabbitMQQueues.ALERTS_NOTIFICATIONS, RabbitMQConfig.EXCHANGE, RabbitMQRoutingKeys.ALERT_ALL);
      await channel.bindQueue(RabbitMQQueues.ALERTS_AI, RabbitMQConfig.EXCHANGE, RabbitMQRoutingKeys.ALERT_ALL);

      this.logger.log('📦 Infraestrutura RabbitMQ configurada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao configurar infraestrutura:', error.message);
      throw error;
    }
  }

  /**
   * Publica um alerta no RabbitMQ
   */
  async publishAlert(alertData: AlertMessage): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('⚠️ RabbitMQ não conectado. Alerta salvo apenas no banco.');
      return false;
    }

    try {
      const routingKey = RabbitMQRoutingKeys.generate(alertData.nicho || 'GERAL', alertData.prioridade || 'MEDIA');

      await this.channelWrapper.publish(RabbitMQConfig.EXCHANGE, routingKey, alertData, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      this.logger.log(`📤 Alerta publicado [${routingKey}]: ${alertData.id_alerta}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao publicar alerta: ${error.message}`);
      return false;
    }
  }

  /**
   * Registra um consumer para uma queue
   */
  async registerConsumer(
    queue: string,
    handler: (message: AlertMessage, rawMessage: ConsumeMessage) => Promise<void>,
    options?: { prefetch?: number },
  ): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: Channel) => {
        await channel.prefetch(options?.prefetch || 1);

        await channel.consume(queue, async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg);
            channel.ack(msg);
          } catch (error) {
            this.logger.error(`Erro ao processar mensagem da queue ${queue}:`, error.message);

            // Verificar número de tentativas
            const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;

            if (retryCount >= RabbitMQRetryConfig.MAX_DELIVERY_ATTEMPTS) {
              // Enviar para DLQ
              this.logger.warn(`Mensagem rejeitada após ${retryCount} tentativas`);
              channel.nack(msg, false, false); // vai para DLX
            } else {
              // Requeue com incremento do contador
              this.logger.log(`Tentativa ${retryCount}/${RabbitMQRetryConfig.MAX_DELIVERY_ATTEMPTS}`);
              channel.nack(msg, false, true);
            }
          }
        });
      });

      this.logger.log(`👂 Consumer registrado para queue: ${queue}`);
    } catch (error) {
      this.logger.error(`Erro ao registrar consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uma queue
   */
  async getQueueStats(queueName: string): Promise<{ messageCount: number; consumerCount: number } | null> {
    if (!this.isConnected) return null;

    try {
      return await this.channelWrapper.checkQueue(queueName);
    } catch (error) {
      this.logger.error(`Erro ao obter stats da queue ${queueName}:`, error.message);
      return null;
    }
  }

  /**
   * Verifica se está conectado
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Obtém o channel wrapper (para operações avançadas)
   */
  getChannelWrapper(): ChannelWrapper {
    return this.channelWrapper;
  }
}
