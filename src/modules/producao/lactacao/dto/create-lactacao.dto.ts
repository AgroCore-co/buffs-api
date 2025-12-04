import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength, IsUUID } from 'class-validator';
import { IsNotFutureDate, IsAfterDate } from '../../../../core/validators/date.validators';

export enum StatusCicloLactacao {
  EM_LACTACAO = 'Em Lactação',
  SECA = 'Seca',
}

export class CreateCicloLactacaoDto {
  @ApiProperty({ description: 'ID da búfala', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_bufala deve ser um UUID válido' })
  id_bufala: string;

  @ApiProperty({ description: 'ID da propriedade onde o ciclo está sendo registrado (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  id_propriedade: string;

  @ApiProperty({ description: 'Data do parto', example: '2025-02-01' })
  @IsDateString({}, { message: 'A data do parto deve estar no formato ISO 8601 válido' })
  @IsNotFutureDate({ message: 'A data do parto não pode estar no futuro' })
  dt_parto: string;

  @ApiProperty({ description: 'Padrão de dias do ciclo', example: 305 })
  @IsInt({ message: 'O padrão de dias deve ser um número inteiro' })
  @IsPositive({ message: 'O padrão de dias deve ser um número positivo' })
  padrao_dias: number;

  @ApiProperty({ description: 'Data real de secagem', required: false, example: '2025-11-10' })
  @IsDateString({}, { message: 'A data de secagem real deve estar no formato ISO 8601 válido' })
  @IsOptional()
  @IsAfterDate('dt_parto', { message: 'A data de secagem deve ser posterior à data do parto' })
  dt_secagem_real?: string;

  @ApiProperty({ description: 'Observação', required: false, example: 'Parto normal' })
  @IsString({ message: 'A observação deve ser uma string' })
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  @IsOptional()
  observacao?: string;
}
