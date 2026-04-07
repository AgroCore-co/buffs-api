import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, IsNotEmpty, Min, MaxLength, IsDateString } from 'class-validator';

/**
 * DTO para criação de registro de alimentação
 *
 * Endpoint: POST /alimentacao/registros
 *
 * Este DTO define os campos necessários para registrar uma ocorrência de alimentação
 * fornecida a um grupo específico de búfalos, vinculando-a a uma definição de alimentação
 * pré-cadastrada.
 *
 * Campos obrigatórios: id_propriedade, id_grupo, id_aliment_def, quantidade, unidade_medida
 * Campos opcionais: freq_dia, dt_registro
 */
export class CreateRegistroAlimentacaoDto {
  @ApiProperty({
    description: 'ID da propriedade à qual este registro pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({
    description: 'ID do grupo de búfalos que receberá a alimentação (UUID). O grupo deve pertencer à mesma propriedade.',
    example: 'a2822db9-3c51-4359-8557-4acafe3b5223',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  id_grupo: string;

  @ApiProperty({
    description:
      'ID da definição de alimentação cadastrada previamente (UUID). Use GET /alimentacoes-def/propriedade/:id para listar as opções disponíveis.',
    example: '09800905-1d30-4ffa-9b95-b2bb09fca0ef',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  id_aliment_def: string;

  @ApiProperty({
    description: 'Quantidade de alimento fornecida (número decimal positivo).',
    example: 50.5,
    required: true,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  quantidade: number;

  @ApiProperty({
    description: 'Unidade de medida da quantidade fornecida. Ex: kg, g, litros, L, sacos, etc.',
    example: 'kg',
    required: true,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidade_medida: string;

  @ApiProperty({
    description: 'Frequência de alimentação por dia (quantas vezes ao dia o alimento é fornecido). Número inteiro positivo.',
    example: 2,
    required: false,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  freq_dia?: number;

  @ApiProperty({
    description:
      'Data e hora do registro no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ). Se não fornecida, será usada a data/hora atual do servidor.',
    example: '2025-10-13T10:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dt_registro?: string;
}
