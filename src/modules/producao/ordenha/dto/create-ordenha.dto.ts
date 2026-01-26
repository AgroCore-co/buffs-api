import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID, IsNumber, IsPositive, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { IsNotFutureDate } from '../../../../core/validators';

export enum PeriodoOrdenha {
  MANHA = 'M',
  TARDE = 'T',
  NOITE = 'N',
}

export class CreateDadosLactacaoDto {
  @ApiProperty({ description: 'ID da búfala', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_bufala deve ser um UUID válido' })
  id_bufala: string;

  @ApiProperty({ description: 'ID da propriedade onde a ordenha foi realizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  id_propriedade: string;

  @ApiProperty({ description: 'ID do ciclo de lactação', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_ciclo_lactacao deve ser um UUID válido' })
  id_ciclo_lactacao: string;

  @ApiProperty({ description: 'Quantidade ordenhada (L)', example: 8.75 })
  @IsNumber({}, { message: 'A quantidade ordenhada deve ser um número' })
  @IsPositive({ message: 'A quantidade ordenhada deve ser um número positivo' })
  qt_ordenha: number;

  @ApiProperty({
    description: 'Período da ordenha',
    example: PeriodoOrdenha.MANHA,
    enum: PeriodoOrdenha,
  })
  @IsEnum(PeriodoOrdenha, { message: 'O período deve ser M (manhã), T (tarde) ou N (noite)' })
  @IsOptional()
  periodo?: PeriodoOrdenha;

  @ApiProperty({ description: 'Ocorrência', example: 'Mastite leve', required: false })
  @IsString({ message: 'A ocorrência deve ser uma string' })
  @MaxLength(255, { message: 'A ocorrência deve ter no máximo 255 caracteres' })
  @IsOptional()
  ocorrencia?: string;

  @ApiProperty({ description: 'Data/hora da ordenha', example: '2025-02-10T06:00:00.000Z' })
  @IsDateString({}, { message: 'A data da ordenha deve estar no formato ISO 8601 válido' })
  @IsNotFutureDate({ message: 'A data da ordenha não pode ser no futuro' })
  dt_ordenha: string;
}
