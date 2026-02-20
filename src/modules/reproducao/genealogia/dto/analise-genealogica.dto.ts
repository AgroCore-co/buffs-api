import { ApiProperty } from '@nestjs/swagger';

/**
 * Dados dos pais retornados pela IA.
 */
export class PaisDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do pai', nullable: true })
  paiId: string | null;

  @ApiProperty({ example: '234e5678-e89b-12d3-a456-426614174001', description: 'ID da mãe', nullable: true })
  maeId: string | null;
}

/**
 * Resumo agregado retornado pela IA (quantidades de ancestrais/descendentes).
 */
export class ResumoGenealogicoDto {
  @ApiProperty({ example: 10, description: 'Total de ancestrais identificados' })
  totalAncestrais: number;

  @ApiProperty({ example: 4, description: 'Total de descendentes identificados' })
  totalDescendentes: number;

  @ApiProperty({ example: 3, description: 'Número de gerações de ancestrais retornadas' })
  geracoesAncestrais: number;

  @ApiProperty({ example: 2, description: 'Número de gerações de descendentes retornadas' })
  geracoesDescendentes: number;
}

/**
 * Resposta da análise genealógica completa de um búfalo, alinhada ao payload atual da IA.
 */
export class AnaliseGenealogicaDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do búfalo analisado' })
  idBufalo: string;

  @ApiProperty({ example: 'M', enum: ['M', 'F'], description: 'Sexo do búfalo' })
  sexo: string;

  @ApiProperty({ example: 3.12, description: 'Coeficiente de consanguinidade em %' })
  consanguinidade: number;

  @ApiProperty({ example: 'Baixo', enum: ['Baixo', 'Moderado', 'Alto', 'Extremo'], description: 'Nível de risco genético' })
  riscoGenetico: string;

  @ApiProperty({ example: 'Consanguinidade < 3.125% - Risco baixo', description: 'Descrição textual do risco' })
  descricaoRisco: string;

  @ApiProperty({ example: false, description: 'Indica se o animal é fundador (sem pais cadastrados)' })
  eFundador: boolean;

  @ApiProperty({ type: PaisDto, description: 'Pais conhecidos do búfalo' })
  pais: PaisDto;

  @ApiProperty({
    example: { geracao_1: ['pai-id', 'mae-id'], geracao_2: ['avo1', 'avo2'] },
    description: 'Ancestrais organizados por geração',
    type: Object,
  })
  ancestrais: Record<string, string[]>;

  @ApiProperty({
    example: { geracao_1: ['filho1', 'filho2'] },
    description: 'Descendentes organizados por geração',
    type: Object,
  })
  descendentes: Record<string, string[]>;

  @ApiProperty({ type: ResumoGenealogicoDto, description: 'Resumo agregado de ancestrais e descendentes' })
  resumo: ResumoGenealogicoDto;
}

/**
 * Informações de macho compatível para acasalamento
 */
export class MachoCompativelDto {
  @ApiProperty({ example: '987e6543-e21b-43d2-b789-123456789abc', description: 'ID do macho' })
  idBufalo: string;

  @ApiProperty({ example: 'Touro Forte', description: 'Nome do macho' })
  nome: string;

  @ApiProperty({ example: 1.5625, description: 'Consanguinidade estimada da cria em %' })
  consanguinidadeEstimada: number;

  @ApiProperty({ example: 'BAIXO', enum: ['BAIXO', 'MODERADO', 'ALTO', 'CRÍTICO'], description: 'Risco genético da cria' })
  riscoGenetico: string;

  @ApiProperty({ example: 85.5, description: 'Score de compatibilidade (0-100)' })
  scoreCompatibilidade: number;
}

/**
 * Resposta da busca por machos compatíveis
 */
export class MachosCompativeisDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da fêmea' })
  femeaId: string;

  @ApiProperty({ type: [MachoCompativelDto], description: 'Lista de machos compatíveis' })
  machosCompativeis: MachoCompativelDto[];

  @ApiProperty({ example: 12, description: 'Total de machos encontrados' })
  totalEncontrados: number;

  @ApiProperty({ example: 6.25, description: 'Limite de consanguinidade usado na busca em %' })
  limiteConsanguinidade: number;
}
