/**
 * Constantes para configuração do RabbitMQ.
 * Centraliza exchanges, queues, routing keys e configurações.
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
  EXCHANGE_TYPE: 'topic',

  /**
   * Configurações de durabilidade
   */
  DURABLE: true,
} as const;

/**
 * Definição de queues do sistema
 */
export const RabbitMQQueues = {
  /**
   * Queue para notificações de alertas
   */
  ALERTS_NOTIFICATIONS: 'buffs.alerts.notifications',

  /**
   * Queue para processamento de IA
   */
  ALERTS_AI: 'buffs.alerts.ai',

  /**
   * Queue para mensagens falhadas (Dead Letter Queue)
   */
  DEAD_LETTER: 'buffs.alerts.failed',
} as const;

/**
 * Routing keys para publicação de mensagens
 */
export const RabbitMQRoutingKeys = {
  /**
   * Alertas de qualquer nicho com qualquer prioridade
   */
  ALERT_ALL: 'alert.*.*',

  /**
   * Alertas de prioridade alta
   */
  ALERT_HIGH_PRIORITY: 'alert.*.ALTA',

  /**
   * Alertas de saúde
   */
  ALERT_HEALTH: 'alert.SAUDE.*',

  /**
   * Alertas de produção
   */
  ALERT_PRODUCTION: 'alert.PRODUCAO.*',

  /**
   * Alertas de reprodução
   */
  ALERT_REPRODUCTION: 'alert.REPRODUCAO.*',

  /**
   * Alertas de alimentação
   */
  ALERT_NUTRITION: 'alert.ALIMENTACAO.*',

  /**
   * Gerar routing key dinamicamente
   */
  generate: (nicho: string, prioridade: string) => `alert.${nicho}.${prioridade}`,
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
