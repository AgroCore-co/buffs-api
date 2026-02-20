import { ApiProperty } from '@nestjs/swagger';

/**
 * Informações sobre ancestral comum na análise genealógica
 */
export class AncestralComumDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do ancestral comum' })
  idBufalo: string;

  @ApiProperty({ example: 'Potente', description: 'Nome do ancestral' })
  nome: string;

  @ApiProperty({ example: 2, description: 'Gerações até o pai' })
  geracoesAtePai: number;

  @ApiProperty({ example: 3, description: 'Gerações até a mãe' })
  geracoesAteMae: number;

  @ApiProperty({ example: 3.125, description: 'Contribuição para consanguinidade em %' })
  contribuicaoConsanguinidade: number;
}

/**
 * Resposta da análise genealógica completa de um búfalo
 */
export class AnaliseGenealogicaDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do búfalo analisado' })
  idBufalo: string;

  @ApiProperty({ example: 'Valente', description: 'Nome do búfalo' })
  nome?: string;

  @ApiProperty({ example: 3.125, description: 'Coeficiente de consanguinidade em %' })
  consanguinidade: number;

  @ApiProperty({ example: 'BAIXO', enum: ['BAIXO', 'MODERADO', 'ALTO', 'CRÍTICO'], description: 'Nível de risco genético' })
  riscoGenetico: string;

  @ApiProperty({ example: 4, description: 'Número de gerações analisadas' })
  geracoesAnalisadas: number;

  @ApiProperty({ example: 6, description: 'Total de ancestrais identificados' })
  totalAncestrais: number;

  @ApiProperty({ type: [AncestralComumDto], description: 'Lista de ancestrais comuns identificados' })
  ancestraisComuns: AncestralComumDto[];

  @ApiProperty({
    example: 'Animal com consanguinidade baixa. Adequado para reprodução sem restrições significativas.',
    description: 'Recomendações baseadas na análise',
  })
  recomendacoes: string;
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
