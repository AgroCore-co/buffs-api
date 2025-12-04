import { ApiProperty } from '@nestjs/swagger';

export class ColetaPropriedadeItemDto {
  @ApiProperty({ description: 'ID da coleta', example: '7e74ec3f-ed2a-4642-8fe2-c3adf74900e5' })
  id_coleta: string;

  @ApiProperty({ description: 'ID da indústria', example: 'a8afbcf3-3a9e-4d14-8e88-d0596b185404' })
  id_industria: string;

  @ApiProperty({ description: 'Nome da indústria/empresa', example: 'Laticínios São João' })
  nome_empresa: string;

  @ApiProperty({ description: 'Resultado do teste de qualidade', example: true })
  resultado_teste: boolean;

  @ApiProperty({ description: 'Observações sobre a coleta', example: 'Coleta aprovada' })
  observacao?: string;

  @ApiProperty({ description: 'Quantidade de leite coletado (litros)', example: 70.136 })
  quantidade: number;

  @ApiProperty({ description: 'Data e hora da coleta', example: '2026-07-05T00:00:00+00:00' })
  dt_coleta: string;

  @ApiProperty({ description: 'ID do funcionário que realizou a coleta', example: '0f1c1e77-7b3d-4c7f-9737-ef65590a16e4' })
  id_funcionario: string;

  @ApiProperty({ description: 'ID da propriedade', example: 'e7625c27-da8d-4ffa-a514-0c191b1fb1e3' })
  id_propriedade: string;
}

export class ColetaPropriedadeMetaDto {
  @ApiProperty({ description: 'Número da página', example: 1 })
  page: number;

  @ApiProperty({ description: 'Itens por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de coletas', example: 521 })
  total: number;

  @ApiProperty({ description: 'Total de páginas', example: 53 })
  totalPages: number;

  @ApiProperty({ description: 'Indica se há próxima página', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Indica se há página anterior', example: false })
  hasPrevPage: boolean;

  @ApiProperty({ description: 'Total de coletas aprovadas', example: 480 })
  totalAprovadas: number;

  @ApiProperty({ description: 'Total de coletas rejeitadas', example: 41 })
  totalRejeitadas: number;
}

export class ColetaPropriedadeResponseDto {
  @ApiProperty({ description: 'Lista de coletas com informações da empresa', type: [ColetaPropriedadeItemDto] })
  data: ColetaPropriedadeItemDto[];

  @ApiProperty({ description: 'Metadados da paginação e estatísticas', type: ColetaPropriedadeMetaDto })
  meta: ColetaPropriedadeMetaDto;
}
