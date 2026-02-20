/**
 * Constantes ESPECÍFICAS do módulo de alertas para RabbitMQ.
 */

/**
 * Definição de queues para alertas
 */
export const AlertsQueues = {
  /**
   * Queue para notificações de alertas
   */
  NOTIFICATIONS: 'buffs.alerts.notifications',

  /**
   * Queue para processamento de IA
   */
  AI_PROCESSING: 'buffs.alerts.ai',

  /**
   * Queue para mensagens falhadas (Dead Letter Queue)
   */
  DEAD_LETTER: 'buffs.alerts.failed',
} as const;

/**
 * Routing keys para alertas
 */
export const AlertsRoutingKeys = {
  /**
   * Alertas de qualquer nicho com qualquer prioridade
   */
  ALL: 'alert.*.*',

  /**
   * Alertas de prioridade alta
   */
  HIGH_PRIORITY: 'alert.*.ALTA',

  /**
   * Alertas de saúde
   */
  HEALTH: 'alert.SAUDE.*',

  /**
   * Alertas de produção
   */
  PRODUCTION: 'alert.PRODUCAO.*',

  /**
   * Alertas de reprodução
   */
  REPRODUCTION: 'alert.REPRODUCAO.*',

  /**
   * Alertas de alimentação
   */
  NUTRITION: 'alert.ALIMENTACAO.*',

  /**
   * Gerar routing key dinamicamente
   */
  generate: (nicho: string, prioridade: string) => `alert.${nicho}.${prioridade}`,
} as const;

/**
 * Configurações específicas de alertas
 */
export const AlertsRabbitMQConfig = {
  /**
   * TTL para mensagens de alerta (ms) - 24 horas
   */
  MESSAGE_TTL: 24 * 60 * 60 * 1000,

  /**
   * Número máximo de tentativas antes de ir para DLQ
   */
  MAX_DELIVERY_ATTEMPTS: 5,

  /**
   * Prefetch para consumers de alertas
   */
  PREFETCH: 1,
} as const;
