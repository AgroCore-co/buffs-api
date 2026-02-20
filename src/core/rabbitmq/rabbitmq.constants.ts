/**
 * Constantes GENÉRICAS para configuração do RabbitMQ.
 * Configurações base que podem ser usadas por qualquer módulo.
 */

export const RabbitMQConfig = {
  /**
   * Exchange principal para eventos do sistema
   */
  EXCHANGE: 'buffs.events',

  /**
   * Exchange para Dead Letter (mensagens falhadas)
   */
  DLX_EXCHANGE: 'buffs.events.dlx',

  /**
   * Tipo de exchange (topic permite routing patterns flexíveis)
   */
  EXCHANGE_TYPE: 'topic' as const,

  /**
   * Configurações de durabilidade
   */
  DURABLE: true,

  /**
   * Queue para processamento de alertas
   */
  ALERTA_QUEUE: 'alerta.queue',

  /**
   * Routing key para geração de alertas
   */
  ALERTA_ROUTING_KEY: 'alerta.gerar',
} as const;

/**
 * Configurações de retry e timeout
 */
export const RabbitMQRetryConfig = {
  /**
   * Número máximo de tentativas de reconexão
   */
  MAX_RECONNECT_ATTEMPTS: 10,

  /**
   * Delay entre tentativas de reconexão (ms)
   */
  RECONNECT_DELAY: 5000,

  /**
   * Timeout para operações (ms)
   */
  OPERATION_TIMEOUT: 10000,

  /**
   * TTL para mensagens (ms) - 24 horas
   */
  MESSAGE_TTL: 24 * 60 * 60 * 1000,

  /**
   * Número máximo de tentativas de processamento antes de ir para DLQ
   */
  MAX_DELIVERY_ATTEMPTS: 5,
} as const;
