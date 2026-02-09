import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsUUID, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDadosSanitariosDto {
  @ApiProperty({ description: 'ID do búfalo atendido', example: '<UUID>' })
  @IsUUID()
  idBufalo: string;

  @ApiProperty({ description: 'ID da medicação aplicada', example: '<UUID>' })
  @IsUUID()
  idMedicao: string;

  @ApiProperty({ description: 'Data de aplicação', example: '2025-02-10' })
  @IsDateString()
  dtAplicacao: string;

  @ApiProperty({ description: 'Dosagem aplicada', example: 15.5 })
  @IsNumber()
  dosagem: number;

  @ApiProperty({ description: 'Unidade de medida da dosagem', example: 'mL' })
  @IsString()
  @MaxLength(20)
  unidade_medida: string;

  @ApiProperty({ description: 'Doença diagnosticada', example: 'Verminose', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  doenca?: string;

  @ApiProperty({ description: 'Se necessita retorno', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  necessita_retorno?: boolean;

  @ApiProperty({ description: 'Data de retorno (se houver)', example: '2025-03-10', required: false })
  @IsDateString()
  @IsOptional()
  dtRetorno?: string;
}
