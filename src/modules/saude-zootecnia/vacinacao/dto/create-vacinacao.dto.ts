import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ToBoolean } from '../../../../core/decorators';
import { IsAfterDate, IsNotFutureDate } from '../../../../core/validators';

export class CreateVacinacaoDto {
  @ApiProperty({ example: '3', description: 'ID da vacina na tabela Medicacoes' })
  @IsUUID('4', { message: 'O idMedicacao deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idMedicacao é obrigatório' })
  idMedicacao: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data em que a vacina foi aplicada' })
  @IsDateString({}, { message: 'A data de aplicação deve estar no formato ISO 8601 válido' })
  @IsNotFutureDate({ message: 'A data de aplicação não pode estar no futuro' })
  @IsNotEmpty({ message: 'A data de aplicação é obrigatória' })
  dtAplicacao: string;

  @ApiProperty({ example: 2.0, description: 'Dosagem aplicada', required: false })
  @IsNumber({}, { message: 'A dosagem deve ser um número' })
  @IsOptional()
  dosagem?: number;

  @ApiProperty({ example: 'ml', description: 'Unidade de medida da dosagem', required: false })
  @IsString({ message: 'A unidade de medida deve ser um texto' })
  @IsOptional()
  unidade_medida?: string;

  @ApiProperty({ example: 'Vacinação Preventiva', description: 'Doença/prevenção', required: false })
  @IsString({ message: 'A doença deve ser um texto' })
  @IsOptional()
  doenca?: string;

  @ApiProperty({ example: false, description: 'Se necessita retorno', required: false })
  @ToBoolean()
  @IsBoolean({ message: 'O campo necessita_retorno deve ser verdadeiro ou falso' })
  @IsOptional()
  necessita_retorno?: boolean;

  @ApiProperty({ example: '2026-08-18', description: 'Data de retorno se necessário', required: false })
  @IsDateString({}, { message: 'A data de retorno deve estar no formato ISO 8601 válido' })
  @IsAfterDate('dtAplicacao', { message: 'A data de retorno deve ser posterior à data de aplicação' })
  @IsOptional()
  dtRetorno?: string;
}
