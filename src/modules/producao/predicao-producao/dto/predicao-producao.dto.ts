import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO de entrada para predição de produção de leite
 */
export class PredicaoProducaoInputDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da fêmea para predição de produção',
  })
  @IsNotEmpty({ message: 'ID da fêmea é obrigatório' })
  @IsUUID('4', { message: 'ID da fêmea deve ser um UUID válido' })
  idFemea: string;
}

/**
 * DTO de resposta da predição de produção
 */
export class PredicaoProducaoResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da fêmea analisada',
  })
  idFemea: string;

  @ApiProperty({
    example: 1250.75,
    description: 'Predição de produção em litros para o próximo ciclo',
  })
  predicaoLitros: number;

  @ApiProperty({
    example: 'ALTA',
    enum: ['MUITO_BAIXA', 'BAIXA', 'MÉDIA', 'ALTA', 'MUITO_ALTA'],
    description: 'Classificação do potencial de produção',
  })
  classificacaoPotencial: string;

  @ApiProperty({
    example: 15.5,
    description: 'Percentual em relação à média da propriedade',
  })
  percentualVsMedia: number;

  @ApiProperty({
    example: 1080.25,
    description: 'Produção média da propriedade em litros',
  })
  producaoMediaPropriedade: number;

  @ApiProperty({
    example: 1,
    description: 'ID da propriedade',
  })
  idPropriedade: number;

  @ApiProperty({
    example: ['idade', 'numero_lactacoes', 'producao_anterior', 'escore_corporal'],
    description: 'Features utilizadas pelo modelo de predição',
    type: [String],
  })
  featuresUtilizadas: string[];

  @ApiProperty({
    example: '2026-02-13T10:30:00Z',
    description: 'Data e hora da predição',
  })
  dataPredicao: string;
}
