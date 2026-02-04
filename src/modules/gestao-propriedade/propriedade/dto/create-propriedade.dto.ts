import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID, Matches } from 'class-validator';

/**
 * DTO para criação de propriedade
 *
 * Endpoint: POST /propriedades
 */
export class CreatePropriedadeDto {
  @ApiProperty({
    description: 'Nome de identificação da propriedade',
    example: 'Fazenda Santa Clara',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiProperty({
    description: 'CNPJ da propriedade (formato: 00.000.000/0000-00)',
    example: '12.345.678/0001-99',
  })
  @IsString()
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato: 00.000.000/0000-00',
  })
  cnpj: string;

  @ApiProperty({
    description: 'ID do endereço da propriedade (UUID). O endereço deve ser criado previamente através do endpoint POST /enderecos',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID('4', { message: 'ID do endereço deve ser um UUID válido' })
  idEndereco: string;

  @ApiProperty({
    description: 'Indica se a propriedade participa do programa ABCB',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  p_abcb?: boolean;

  @ApiProperty({
    description: 'Tipo de manejo: "P" para pasto, "C" para Concentração',
    example: 'P',
    required: false,
  })
  @IsString()
  @IsOptional()
  tipoManejo?: string;
}
