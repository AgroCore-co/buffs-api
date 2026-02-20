import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage, Options } from 'amqplib';
import { RabbitMQConfig, RabbitMQRetryConfig } from './rabbitmq.constants';

/**
 * Helper para extrair mensagem de erro de forma segura
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Opções para criação de queue
 */
export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, unknown>;
}

/**
 * Opções para publicação de mensagens
 */
export interface PublishOptions {
  persistent?: boolean;
  contentType?: string;
  timestamp?: number;
  headers?: Record<string, unknown>;
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
        const errorMsg = err?.err ? getErrorMessage(err.err) : 'Desconhecido';
        this.logger.warn('⚠️ Desconectado do RabbitMQ', errorMsg);
      });

      this.connection.on('connectFailed', (err) => {
        const errorMsg = err?.err ? getErrorMessage(err.err) : 'Desconhecido';
        this.logger.error('❌ Falha ao conectar no RabbitMQ', errorMsg);
      });

      // Criar channel wrapper
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: Channel) => {
          await this.setupBaseInfrastructure(channel);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('🚀 RabbitMQ inicializado e pronto para uso');
    } catch (error: unknown) {
      this.logger.error('❌ Erro crítico ao inicializar RabbitMQ:', getErrorMessage(error));
      // NÃO lançar erro - sistema deve funcionar sem RabbitMQ
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Fechando conexão com RabbitMQ...');
      await this.channelWrapper?.close();
      await this.connection?.close();
      this.logger.log('✅ Conexão com RabbitMQ fechada');
    } catch (error: unknown) {
      this.logger.error('Erro ao fechar conexão:', getErrorMessage(error));
    }
  }

  /**
   * Configura apenas a infraestrutura base (exchanges)
   * Queues específicas devem ser criadas por cada módulo
   */
  private async setupBaseInfrastructure(channel: Channel): Promise<void> {
    try {
      // 1. Criar exchange principal
      await channel.assertExchange(RabbitMQConfig.EXCHANGE, RabbitMQConfig.EXCHANGE_TYPE, {
        durable: RabbitMQConfig.DURABLE,
      });

      // 2. Criar exchange DLX (Dead Letter Exchange)
      await channel.assertExchange(RabbitMQConfig.DLX_EXCHANGE, RabbitMQConfig.EXCHANGE_TYPE, {
        durable: RabbitMQConfig.DURABLE,
      });

      this.logger.log('📦 Infraestrutura base RabbitMQ configurada');
    } catch (error: unknown) {
      this.logger.error('Erro ao configurar infraestrutura base:', getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Publica uma mensagem genérica no exchange
   */
  async publish<T = unknown>(routingKey: string, message: T, options: PublishOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('⚠️ RabbitMQ não conectado. Mensagem não foi publicada.');
      return false;
    }

    try {
      await this.channelWrapper.publish(RabbitMQConfig.EXCHANGE, routingKey, message, {
        persistent: options.persistent ?? true,
        contentType: options.contentType ?? 'application/json',
        timestamp: options.timestamp ?? Date.now(),
        headers: options.headers,
      });

      this.logger.log(`📤 Mensagem publicada [${routingKey}]`);
      return true;
    } catch (error: unknown) {
      this.logger.error(`❌ Erro ao publicar mensagem: ${getErrorMessage(error)}`);
      return false;
    }
  }

  /**
   * Cria uma queue com opções configuráveis
   */
  async assertQueue(queueName: string, options: QueueOptions = {}): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: Channel) => {
        await channel.assertQueue(queueName, {
          durable: options.durable ?? true,
          exclusive: options.exclusive ?? false,
          autoDelete: options.autoDelete ?? false,
          arguments: options.arguments,
        });
      });

      this.logger.log(`✅ Queue criada/verificada: ${queueName}`);
    } catch (error: unknown) {
      this.logger.error(`Erro ao criar queue ${queueName}:`, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Faz bind de uma queue a um routing pattern
   */
  async bindQueue(queueName: string, routingKey: string): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: Channel) => {
        await channel.bindQueue(queueName, RabbitMQConfig.EXCHANGE, routingKey);
      });

      this.logger.log(`🔗 Bind criado: ${queueName} -> ${routingKey}`);
    } catch (error: unknown) {
      this.logger.error(`Erro ao fazer bind: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Registra um consumer genérico para uma queue
   */
  async consume<T = unknown>(
    queue: string,
    handler: (message: T, rawMessage: ConsumeMessage) => Promise<void>,
    options?: { prefetch?: number },
  ): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: Channel) => {
        await channel.prefetch(options?.prefetch ?? 1);

        await channel.consume(queue, (msg: ConsumeMessage | null) => {
          if (!msg) return;

          // Processar mensagem de forma assíncrona sem retornar a Promise
          void (async () => {
            try {
              const content = JSON.parse(msg.content.toString()) as T;
              await handler(content, msg);
              channel.ack(msg);
            } catch (error: unknown) {
              this.logger.error(`Erro ao processar mensagem da queue ${queue}:`, getErrorMessage(error));

              // Verificar número de tentativas
              const retryCount = (msg.properties.headers?.['x-retry-count'] ?? 0) + 1;

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
          })();
        });
      });

      this.logger.log(`👂 Consumer registrado para queue: ${queue}`);
    } catch (error: unknown) {
      this.logger.error(`Erro ao registrar consumer: ${getErrorMessage(error)}`);
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
    } catch (error: unknown) {
      this.logger.error(`Erro ao obter stats da queue ${queueName}:`, getErrorMessage(error));
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
