import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDadoZootecnicoDto {
  @ApiProperty({ description: 'Peso do animal em kg', example: 320.5 })
  @IsNumber()
  @IsNotEmpty()
  peso: number;

  @ApiProperty({ description: 'Condição corporal (escala numérica)', example: 3.25 })
  @IsNumber()
  @IsNotEmpty()
  condicaoCorporal: number;

  @ApiProperty({ description: 'Cor da pelagem', required: false, example: 'Preta' })
  @IsString()
  @IsOptional()
  corPelagem?: string;

  @ApiProperty({ description: 'Formato do chifre', required: false, example: 'Curvado' })
  @IsString()
  @IsOptional()
  formatoChifre?: string;

  @ApiProperty({ description: 'Porte corporal', required: false, example: 'Médio' })
  @IsString()
  @IsOptional()
  porteCorporal?: string;

  @ApiProperty({ description: 'Data do registro (opcional)', required: false, example: '2025-02-10' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dtRegistro?: Date;

  @ApiProperty({ description: 'Tipo de pesagem', example: 'Pesagem mensal' })
  @IsString()
  @IsNotEmpty()
  tipoPesagem: string;
}
