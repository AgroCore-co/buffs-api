/**
 * Constantes centrais para configuração do RabbitMQ.
 *
 * Usa @nestjs/microservices com transporte RMQ nativo.
 * Uma única queue `buffs.alerts` recebe todos os eventos de alertas.
 * Mensagens falhadas são roteadas para DLQ via Dead Letter Exchange.
 */

/**
 * Token de injeção para o ClientProxy do RabbitMQ
 */
export const RABBITMQ_SERVICE = 'RABBITMQ_SERVICE';

/**
 * Nomes das queues
 */
export const RabbitMQQueues = {
  /** Queue principal para eventos de alertas */
  ALERTS: 'buffs.alerts',
  /** Dead Letter Queue para mensagens falhadas */
  DLQ: 'buffs.alerts.dlq',
} as const;

/**
 * Event patterns usados com @EventPattern / client.emit()
 */
export const RabbitMQPatterns = {
  /** Emitido quando um alerta é criado no banco */
  ALERTA_CRIADO: 'alerta_criado',
} as const;

/**
 * Dead Letter Exchange name
 */
export const DLX_EXCHANGE = 'buffs.dlx';

/**
 * URL padrão para desenvolvimento local
 */
export const RABBITMQ_DEFAULT_URL = 'amqp://admin:admin@localhost:5672';
