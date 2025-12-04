import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta para fêmeas em período de lactação ativo.
 *
 * Utilizado pelo endpoint GET /lactacao/femeas/em-lactacao/:id_propriedade
 * para listar búfalas que estão atualmente produzindo leite.
 *
 * @example
 * ```json
 * {
 *   "id_bufalo": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   "nome": "Mimosa",
 *   "brinco": "BR-12345",
 *   "idade_meses": 48,
 *   "raca": "Murrah",
 *   "classificacao": "Ótima",
 *   "ciclo_atual": {
 *     "id_ciclo_lactacao": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
 *     "numero_ciclo": 2,
 *     "dt_parto": "2024-04-15",
 *     "dias_em_lactacao": 195,
 *     "dt_secagem_prevista": "2025-02-15",
 *     "status": "Em Lactação"
 *   },
 *   "producao_atual": {
 *     "total_produzido": 2437.5,
 *     "media_diaria": 12.5,
 *     "ultima_ordenha": {
 *       "data": "2025-10-29T06:30:00Z",
 *       "quantidade": 13.2,
 *       "periodo": "M"
 *     }
 *   }
 * }
 * ```
 */
export class FemeaEmLactacaoDto {
  /**
   * Identificador único da búfala (UUID v4)
   * @example 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
   */
  @ApiProperty({
    description: 'ID único da búfala (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  id_bufalo: string;

  /**
   * Nome de registro da búfala
   * @example 'Mimosa'
   */
  @ApiProperty({
    description: 'Nome da búfala',
    example: 'Mimosa',
    minLength: 1,
    maxLength: 100,
  })
  nome: string;

  /**
   * Número de identificação do brinco da búfala.
   * Pode ser nacional (SISBOV) ou interno da propriedade.
   * @example 'BR-12345'
   */
  @ApiProperty({
    description: 'Brinco de identificação (SISBOV ou interno)',
    example: 'BR-12345',
    maxLength: 50,
  })
  brinco: string;

  /**
   * Idade calculada da búfala em meses completos.
   * Calculado a partir da data de nascimento (dt_nascimento).
   * @example 48
   */
  @ApiProperty({
    description: 'Idade da búfala em meses',
    example: 48,
    minimum: 0,
    type: 'integer',
  })
  idade_meses: number;

  /**
   * Nome da raça da búfala conforme cadastro.
   * Obtido através da relação com a tabela 'raca'.
   * @example 'Murrah'
   */
  @ApiProperty({
    description: 'Nome da raça da búfala',
    example: 'Murrah',
  })
  raca: string;

  /**
   * Classificação da búfala baseada na produção comparada à média do rebanho.
   * - Ótima: produção >= 120% da média
   * - Boa: produção >= média
   * - Mediana: produção >= 80% da média
   * - Ruim: produção < 80% da média
   * @example 'Ótima'
   */
  @ApiProperty({
    description: 'Classificação da produção (Ótima, Boa, Mediana, Ruim)',
    example: 'Ótima',
    enum: ['Ótima', 'Boa', 'Mediana', 'Ruim'],
  })
  classificacao: string;

  /**
   * Informações do ciclo de lactação ativo.
   * Um ciclo inicia-se no parto e encerra-se na secagem.
   * Status deve ser "Em Lactação" para aparecer nesta lista.
   */
  @ApiProperty({
    description: 'Dados do ciclo de lactação atual',
    type: 'object',
    properties: {
      id_ciclo_lactacao: {
        type: 'string',
        format: 'uuid',
        description: 'ID único do ciclo de lactação',
      },
      numero_ciclo: {
        type: 'integer',
        description: 'Número sequencial do ciclo (1º parto = ciclo 1, 2º parto = ciclo 2, etc.)',
        minimum: 1,
      },
      dt_parto: {
        type: 'string',
        format: 'date',
        description: 'Data do parto que iniciou este ciclo',
      },
      dias_em_lactacao: {
        type: 'integer',
        description: 'Dias desde o parto até hoje',
        minimum: 0,
      },
      dt_secagem_prevista: {
        type: 'string',
        format: 'date',
        description: 'Data prevista para secagem (padrão: dt_parto + 305 dias)',
      },
      status: {
        type: 'string',
        enum: ['Em Lactação', 'Seca'],
        description: 'Status atual do ciclo',
      },
    },
  })
  ciclo_atual: {
    /** ID único do ciclo de lactação */
    id_ciclo_lactacao: string;
    /** Número sequencial do ciclo (1, 2, 3...) */
    numero_ciclo: number;
    /** Data do parto que iniciou este ciclo */
    dt_parto: string;
    /** Dias desde o parto */
    dias_em_lactacao: number;
    /** Data prevista para encerrar a lactação */
    dt_secagem_prevista: string;
    /** Status do ciclo (sempre "Em Lactação" neste endpoint) */
    status: string;
  };

  /**
   * Estatísticas de produção leiteira do ciclo atual.
   * Calculado somando todos os registros de dadoslactacao
   * desde a dt_parto do ciclo ativo.
   */
  @ApiProperty({
    description: 'Estatísticas de produção do ciclo atual',
    type: 'object',
    properties: {
      total_produzido: {
        type: 'number',
        format: 'float',
        description: 'Total de litros produzidos no ciclo atual',
        minimum: 0,
      },
      media_diaria: {
        type: 'number',
        format: 'float',
        description: 'Média de litros por controle leiteiro realizado (total_produzido / quantidade_de_ordenhas_registradas)',
        minimum: 0,
      },
      ultima_ordenha: {
        type: 'object',
        nullable: true,
        description: 'Dados da ordenha mais recente (null se ainda não houve ordenha)',
        properties: {
          data: {
            type: 'string',
            format: 'date-time',
            description: 'Data e hora da última ordenha',
          },
          quantidade: {
            type: 'number',
            format: 'float',
            description: 'Quantidade de litros na última ordenha',
            minimum: 0,
          },
          periodo: {
            type: 'string',
            enum: ['M', 'T', 'N'],
            description: 'Período da ordenha (M=Manhã, T=Tarde, N=Noite)',
          },
        },
      },
    },
  })
  producao_atual: {
    /** Total acumulado de litros no ciclo */
    total_produzido: number;
    /** Média por controle leiteiro (litros/ordenha) */
    media_diaria: number;
    /** Dados da ordenha mais recente */
    ultima_ordenha: {
      /** Timestamp da ordenha */
      data: string;
      /** Litros ordenhados */
      quantidade: number;
      /** Período (M/T/N) */
      periodo: string;
    } | null;
  };
}
