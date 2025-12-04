import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsPositive, MaxLength, IsString } from 'class-validator';
import { IsNotFutureDate } from '../../../../core/validators';

export class CreateEstoqueLeiteDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID da propriedade onde o estoque está localizado' })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O id_propriedade é obrigatório' })
  id_propriedade: string;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID do usuário que registrou o estoque' })
  @IsUUID('4', { message: 'O id_usuario deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O id_usuario é obrigatório' })
  id_usuario: string;

  @ApiProperty({ example: 1200.75, description: 'Quantidade de leite em estoque (em litros)' })
  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @IsPositive({ message: 'A quantidade deve ser um número positivo' })
  @IsNotEmpty({ message: 'A quantidade é obrigatória' })
  quantidade: number;

  @ApiProperty({ example: '2025-08-18T18:00:00.000Z', description: 'Data e hora do registro de estoque', required: false })
  @IsDateString({}, { message: 'A data de registro deve estar no formato ISO 8601 válido' })
  @IsNotFutureDate({ message: 'A data de registro não pode ser no futuro' })
  @IsOptional()
  dt_registro?: string;

  @ApiProperty({ example: 'Tanque principal resfriado a 4°C.', description: 'Observações sobre o estoque', required: false })
  @IsString({ message: 'A observação deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  observacao?: string;
}
