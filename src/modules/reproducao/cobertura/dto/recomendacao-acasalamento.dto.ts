import { ApiProperty } from '@nestjs/swagger';

/**
 * Dados reprodutivos detalhados para fêmeas (IAR)
 * Baseado no Índice de Aptidão Reprodutiva
 */
export interface DadosReprodutivosFemea {
  /** Status atual ('Apta (Pós-Parto)', 'Apta (Novilha)', 'Inapta - PEV', etc) */
  status: string;
  /** Dias pós-parto (null se novilha) */
  dias_pos_parto: number | null;
  /** Dias em lactação (null se seca ou novilha) */
  dias_em_lactacao: number | null;
  /** Número de ciclos de lactação completos */
  numero_ciclos: number;
  /** Intervalo Entre Partos médio em dias (null se < 2 partos) */
  iep_medio_dias: number | null;
}

/**
 * Dados reprodutivos detalhados para machos (IVR)
 * Baseado no Índice de Valor Reprodutivo
 */
export interface DadosReprodutivosMacho {
  /** Total de coberturas com diagnóstico */
  total_coberturas: number;
  /** Coberturas que resultaram em prenhez */
  total_prenhezes: number;
  /** Taxa de Concepção Bruta (TCB) - não ajustada */
  taxa_concepcao_bruta: number;
  /** Taxa de Concepção Ajustada (TCA) - com regressão bayesiana */
  taxa_concepcao_ajustada: number;
  /** Confiabilidade da estimativa (baseada no N de observações) */
  confiabilidade: 'Baixa' | 'Média' | 'Alta';
  /** Data da última cobertura */
  ultima_cobertura: string | null;
  /** Dias desde a última cobertura */
  dias_desde_ultima_cobertura: number | null;
}

/**
 * Motivo que contribuiu para o score IAR/IVR
 */
export class MotivoScore {
  @ApiProperty({
    description: 'Descrição do critério avaliado',
    example: 'Janela ideal pós-parto para cobertura',
  })
  descricao: string;
}

/**
 * DTO de resposta para recomendação de fêmeas para acasalamento
 * Baseado no Índice de Aptidão Reprodutiva (IAR)
 *
 * Fórmula: IAR = (FP_Prontidao * 0.50) + (FP_Idade * 0.15) + (FP_Historico * 0.20) + (FP_Lactacao * 0.15)
 *
 * Fatores:
 * - FP_Prontidao (50%): Prontidão fisiológica baseada em DPP ou idade (novilha)
 * - FP_Idade (15%): Janela de idade produtiva
 * - FP_Historico (20%): Eficiência reprodutiva histórica (IEP médio)
 * - FP_Lactacao (15%): Modulador de lactação (penaliza pico)
 *
 * @example
 * {
 *   "id_bufalo": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   "nome": "Aurora",
 *   "brinco": "IZ-004",
 *   "idade_meses": 52,
 *   "raca": "Jafarabadi",
 *   "dados_reprodutivos": {
 *     "status": "Apta (Pós-Parto)",
 *     "dias_pos_parto": 65,
 *     "dias_em_lactacao": 65,
 *     "numero_ciclos": 3,
 *     "iep_medio_dias": 375
 *   },
 *   "score": 98.5,
 *   "motivos": [
 *     { "descricao": "Janela ideal pós-parto para cobertura" },
 *     { "descricao": "Histórico de IEP excelente" }
 *   ]
 * }
 */
export class RecomendacaoFemeaDto {
  @ApiProperty({
    description: 'ID único da búfala no sistema',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  idBufalo: string;

  @ApiProperty({
    description: 'Nome cadastrado da búfala',
    example: 'Aurora',
  })
  nome: string;

  @ApiProperty({
    description: 'Código do brinco de identificação',
    example: 'IZ-004',
  })
  brinco: string;

  @ApiProperty({
    description: 'Idade em meses',
    example: 52,
  })
  idadeMeses: number;

  @ApiProperty({
    description: 'Nome da raça',
    example: 'Jafarabadi',
  })
  raca: string;

  @ApiProperty({
    description: 'Dados reprodutivos baseados no IAR',
  })
  dados_reprodutivos: DadosReprodutivosFemea;

  @ApiProperty({
    description: 'IAR Score - Índice de Aptidão Reprodutiva (0-100)',
    minimum: 0,
    maximum: 100,
    example: 98.5,
  })
  score: number;

  @ApiProperty({
    description: 'Lista de motivos que justificam o score',
    type: [MotivoScore],
  })
  motivos: MotivoScore[];
}

/**
 * DTO de resposta para recomendação de machos para acasalamento
 * Baseado no Índice de Valor Reprodutivo (IVR)
 *
 * Fórmula: TCA = ((N * TCB) + (K * MR)) / (N + K)
 * Onde:
 * - N = número de coberturas do touro
 * - TCB = Taxa de Concepção Bruta do touro
 * - K = fator de confiabilidade (20)
 * - MR = Média do Rebanho (taxa de concepção média da propriedade)
 * - TCA = Taxa de Concepção Ajustada (normalizada 0-100)
 *
 * @example
 * {
 *   "id_bufalo": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   "nome": "Titan",
 *   "brinco": "TR-001",
 *   "idade_meses": 60,
 *   "raca": "Murrah",
 *   "categoria_abcb": "PO",
 *   "dados_reprodutivos": {
 *     "total_coberturas": 40,
 *     "total_prenhezes": 32,
 *     "taxa_concepcao_bruta": 80.0,
 *     "taxa_concepcao_ajustada": 71.7,
 *     "confiabilidade": "Alta",
 *     "ultima_cobertura": "2025-09-01",
 *     "dias_desde_ultima_cobertura": 70
 *   },
 *   "score": 79.7,
 *   "motivos": [
 *     { "descricao": "Taxa de Concepção Ajustada: 71.7%" },
 *     { "descricao": "Confiabilidade: Alta (40 coberturas registradas)" }
 *   ]
 * }
 */
export class RecomendacaoMachoDto {
  @ApiProperty({
    description: 'ID único do búfalo no sistema',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  idBufalo: string;

  @ApiProperty({
    description: 'Nome cadastrado do búfalo',
    example: 'Titan',
  })
  nome: string;

  @ApiProperty({
    description: 'Código do brinco de identificação',
    example: 'TR-001',
  })
  brinco: string;

  @ApiProperty({
    description: 'Idade em meses',
    example: 60,
  })
  idadeMeses: number;

  @ApiProperty({
    description: 'Nome da raça',
    example: 'Murrah',
  })
  raca: string;

  @ApiProperty({
    description: 'Categoria ABCB (qualidade genética)',
    example: 'PO',
    nullable: true,
  })
  categoria_abcb: string | null;

  @ApiProperty({
    description: 'Dados reprodutivos baseados no IVR',
  })
  dados_reprodutivos: DadosReprodutivosMacho;

  @ApiProperty({
    description: 'IVR Score - Índice de Valor Reprodutivo (0-100)',
    minimum: 0,
    maximum: 100,
    example: 79.7,
  })
  score: number;

  @ApiProperty({
    description: 'Lista de motivos que justificam o score',
    type: [MotivoScore],
  })
  motivos: MotivoScore[];
}
