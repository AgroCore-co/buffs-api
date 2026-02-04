import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsIn, IsPositive, MaxLength, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNotFutureDate } from '../../../../core/validators';

const tiposValidos = ['Sêmen', 'Embrião', 'Óvulo'];
const origensValidas = ['Coleta Própria', 'Compra'];

export class CreateMaterialGeneticoDto {
  @ApiProperty({ description: 'ID da propriedade onde o material genético está armazenado (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  idPropriedade: string;

  @ApiProperty({ example: 'Sêmen', description: 'Tipo do material genético', enum: tiposValidos })
  @IsString()
  @IsNotEmpty()
  @IsIn(tiposValidos)
  tipo: string;

  @ApiProperty({ example: 'Coleta Própria', description: 'Origem do material', enum: origensValidas })
  @IsString()
  @IsNotEmpty()
  @IsIn(origensValidas)
  origem: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID do búfalo do qual o material foi coletado (se a origem for "Coleta Própria")',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  idBufaloOrigem?: string;

  @ApiProperty({
    example: 'Central de Genética XYZ',
    description: 'Nome do fornecedor (se a origem for "Compra")',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fornecedor?: string;

  @ApiProperty({
    example: '2025-07-20T10:30:00Z',
    description: 'Data e hora em que o material foi coletado ou adquirido (formato ISO 8601)',
  })
  @IsDateString()
  @IsNotFutureDate({ message: 'A data de coleta não pode ser no futuro' })
  @IsNotEmpty()
  dataColeta: string;
}
