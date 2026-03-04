import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum representando os estados possíveis do processamento de uma planilha.
 */
export enum StatusProcessamento {
  PROCESSANDO = 'PROCESSANDO',
  CONCLUIDO = 'CONCLUIDO',
  ERRO = 'ERRO',
}

/**
 * DTO de resposta para o upload de planilha.
 *
 * Retornado após o envio bem-sucedido do arquivo para a fila
 * de processamento assíncrono (RabbitMQ).
 *
 * @example
 * ```json
 * {
 *   "message": "Planilha enviada para processamento",
 *   "arquivo_id": "123e4567-e89b-12d3-a456-426614174000_1709439346000.xlsx",
 *   "status": "PROCESSANDO"
 * }
 * ```
 */
export class UploadPlanilhaResponseDto {
  @ApiProperty({
    description: 'Mensagem de confirmação do recebimento.',
    example: 'Planilha enviada para processamento',
  })
  message: string;

  @ApiProperty({
    description: 'Identificador único do arquivo enviado (propriedadeId + timestamp + extensão).',
    example: '123e4567-e89b-12d3-a456-426614174000_1709439346000.xlsx',
  })
  arquivo_id: string;

  @ApiProperty({
    description: 'Status atual do processamento da planilha.',
    example: StatusProcessamento.PROCESSANDO,
    enum: StatusProcessamento,
  })
  status: StatusProcessamento;
}
