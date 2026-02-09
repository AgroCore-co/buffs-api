import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotFutureDate } from '../../../../core/validators/date.validators';

/**
 * DTO para inativação formal de búfalo no sistema.
 *
 * **Propósito:**
 * Define a estrutura de dados necessária para registrar formalmente a baixa de um búfalo,
 * diferenciando-se do soft delete por incluir rastreabilidade completa (data e motivo).
 *
 * **Diferenças entre inativação e soft delete:**
 * - **Inativar**: Registra `data_baixa` e `motivo_inativo` (rastreabilidade formal para auditoria)
 * - **Soft Delete**: Apenas marca `deleted_at` (remoção lógica simples)
 *
 * **Validações aplicadas:**
 * - Data de baixa é obrigatória e não pode estar no futuro
 * - Motivo é obrigatório e tem limite de 255 caracteres
 * - Data de baixa será validada contra data de nascimento no service
 *
 * **Casos de uso comuns:**
 * - Venda do animal para outra propriedade
 * - Morte natural ou por doença
 * - Descarte por baixa produtividade
 * - Abate para consumo
 * - Transferência definitiva
 *
 * @example
 * ```typescript
 * const inativarDto = {
 *   data_baixa: new Date('2024-01-20'),
 *   motivo_inativo: 'Venda para propriedade XYZ'
 * };
 * ```
 */
export class InativarBufaloDto {
  @ApiProperty({
    description: 'Data da baixa/inativação do animal. Não pode estar no futuro e será validada contra a data de nascimento.',
    example: '2024-01-20T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty({ message: 'A data de baixa é obrigatória' })
  @IsNotFutureDate({ message: 'A data de baixa não pode estar no futuro' })
  dataBaixa: Date;

  @ApiProperty({
    description: 'Motivo da inativação. Deve ser claro e específico para rastreabilidade.',
    example: 'Venda para outra propriedade',
    maxLength: 255,
    examples: {
      venda: { value: 'Venda para outra propriedade' },
      morte: { value: 'Morte natural' },
      descarte: { value: 'Descarte por baixa produtividade' },
      abate: { value: 'Abate para consumo' },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'O motivo da inativação é obrigatório' })
  @MaxLength(255, { message: 'O motivo deve ter no máximo 255 caracteres' })
  motivoInativo: string;
}
