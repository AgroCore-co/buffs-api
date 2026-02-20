/**
 * Interface para mensagens de alerta recebidas via RabbitMQ
 */
export interface AlertaMessage {
  /**
   * Tipo do alerta (ex: 'REPRODUCAO', 'SANITARIO', 'PRODUCAO', etc.)
   */
  tipo: string;

  /**
   * ID da entidade relacionada ao alerta (ex: ID do búfalo, ID da cobertura, etc.)
   */
  entidadeId: string;

  /**
   * Mensagem descritiva do alerta
   */
  mensagem: string;

  /**
   * Severidade do alerta (ex: 'BAIXA', 'MEDIA', 'ALTA')
   */
  severidade: string;
}
