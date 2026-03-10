import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportFiltersDto {
  @ApiProperty({
    description: 'UUID da propriedade.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'propriedadeId deve ser um UUID v4 válido' })
  propriedadeId: string;

  @ApiProperty({
    description: 'UUID do grupo para filtrar.',
    required: false,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'grupoId deve ser um UUID v4 válido' })
  grupoId?: string;

  @ApiProperty({
    description: 'Nível de maturidade do animal.',
    required: false,
    enum: ['novilha', 'primipara', 'multipara'],
  })
  @IsOptional()
  @IsEnum(['novilha', 'primipara', 'multipara'], {
    message: 'maturidade deve ser: novilha, primipara ou multipara',
  })
  maturidade?: string;

  @ApiProperty({
    description: 'Sexo do animal (apenas para pesagem).',
    required: false,
    enum: ['M', 'F'],
  })
  @IsOptional()
  @IsEnum(['M', 'F'], { message: 'sexo deve ser: M ou F' })
  sexo?: string;

  @ApiProperty({
    description: 'Tipo de inseminação (apenas para reprodução).',
    required: false,
    enum: ['MN', 'IA', 'IATF', 'TE'],
  })
  @IsOptional()
  @IsEnum(['MN', 'IA', 'IATF', 'TE'], { message: 'tipo deve ser: MN, IA, IATF ou TE' })
  tipo?: string;

  @ApiProperty({
    description: 'Data inicial do filtro (ISO 8601).',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'de deve ser uma data válida (ISO 8601)' })
  de?: string;

  @ApiProperty({
    description: 'Data final do filtro (ISO 8601).',
    required: false,
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'ate deve ser uma data válida (ISO 8601)' })
  ate?: string;
}
