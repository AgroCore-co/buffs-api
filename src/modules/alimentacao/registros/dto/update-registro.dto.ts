import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MaxLength, IsDateString } from 'class-validator';
import { IsNotFutureDate } from '../../../../core/validators/date.validators';

/**
 * DTO para atualização de registro de alimentação
 *
 * Endpoint: PATCH /alimentacao/registros/:id
 *
 * Apenas campos operacionais podem ser alterados após criação.
 */
export class UpdateRegistroAlimentacaoDto {
  @ApiPropertyOptional({
    description: 'Quantidade de alimento fornecida (número decimal positivo).',
    example: 55.75,
    minimum: 0.01,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  quantidade?: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida da quantidade fornecida. Ex: kg, g, litros, L, sacos, etc.',
    example: 'kg',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  unidade_medida?: string;

  @ApiPropertyOptional({
    description: 'Frequência de alimentação por dia (quantas vezes ao dia o alimento é fornecido). Número inteiro positivo.',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  freq_dia?: number;

  @ApiPropertyOptional({
    description: 'Data e hora do registro no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ).',
    example: '2026-03-18T10:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  @IsNotFutureDate()
  dt_registro?: string;
}
