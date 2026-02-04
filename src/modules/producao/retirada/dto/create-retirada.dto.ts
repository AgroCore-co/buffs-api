import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsString, IsNumber, MaxLength, IsPositive } from 'class-validator';
import { IsNotFutureDate } from '../../../../core/validators/date.validators';

export class CreateRetiradaDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID da indústria que realizou a coleta' })
  @IsUUID('4', { message: 'O idIndustria deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idIndustria é obrigatório' })
  idIndustria: string;

  @ApiProperty({ description: 'ID da propriedade onde a coleta foi realizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O idPropriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idPropriedade é obrigatório' })
  idPropriedade: string;

  @ApiProperty({ example: true, description: 'Resultado do teste de qualidade do leite (aprovado/reprovado)', required: false })
  @IsBoolean({ message: 'O resultado do teste deve ser um valor booleano' })
  @IsOptional()
  resultadoTeste?: boolean;

  @ApiProperty({ example: 'Leite com acidez um pouco elevada.', description: 'Observações sobre a coleta', required: false })
  @IsString({ message: 'A observação deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  observacao?: string;

  @ApiProperty({ example: 250.5, description: 'Quantidade de leite coletado (em litros)' })
  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @IsPositive({ message: 'A quantidade deve ser um número positivo' })
  @IsNotEmpty({ message: 'A quantidade é obrigatória' })
  quantidade: number;

  @ApiProperty({ example: '2025-08-18T08:30:00.000Z', description: 'Data e hora da coleta' })
  @IsDateString({}, { message: 'A data da coleta deve estar no formato ISO 8601 válido' })
  @IsNotEmpty({ message: 'A data da coleta é obrigatória' })
  @IsNotFutureDate({ message: 'A data da coleta não pode estar no futuro' })
  dtColeta: string;
}
