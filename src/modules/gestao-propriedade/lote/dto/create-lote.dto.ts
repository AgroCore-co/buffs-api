import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLoteDto {
  @ApiProperty({
    description: 'Nome de identificação do lote/piquete.',
    example: 'Pasto da Sede',
  })
  @IsString()
  @IsNotEmpty()
  nomeLote: string;

  @ApiProperty({
    description: 'ID da propriedade à qual este lote pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  idPropriedade: string;

  @ApiProperty({
    description: 'ID do grupo de búfalos associado a este lote (UUID). Quando informado, o grupo deve pertencer à mesma propriedade do lote.',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idGrupo?: string;

  @ApiProperty({
    description: 'Tipo do lote (ex: pasto, curral, etc).',
    example: 'Pasto',
    required: false,
  })
  @IsString()
  @IsOptional()
  tipoLote?: string;

  @ApiProperty({
    description: 'Status do lote (ativo, inativo, manutenção).',
    example: 'ativo',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Descrição opcional sobre o lote.',
    example: 'Lote principal para recria.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Quantidade máxima de animais suportada pelo lote.',
    example: 50,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  qtd_max?: number;

  @ApiProperty({
    description: 'Área do lote em metros quadrados.',
    example: 10000.5,
    required: false,
  })
  @IsPositive()
  @IsOptional()
  area_m2?: number;

  @ApiProperty({
    description: `String GeoJSON contendo a geometria do polígono. O frontend envia como string JSON.stringify(geoJson) e recebe como objeto parseado pronto para usar com Leaflet.`,
    example: '{"type":"Polygon","coordinates":[[[-47.5,-24.5],[-47.4,-24.5],[-47.4,-24.4],[-47.5,-24.4],[-47.5,-24.5]]]}',
    required: false,
  })
  @IsString()
  @IsOptional()
  geo_mapa?: string;
}
