import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta contendo o resumo completo de produção de uma búfala.
 *
 * Este endpoint consolida informações de:
 * - Identificação da búfala
 * - Ciclo de lactação ativo (se houver)
 * - Histórico de todos os ciclos anteriores
 * - Gráfico de produção diária (últimos 30 dias)
 *
 * Utilizado para exibir dashboards e relatórios individuais.
 *
 * @example
 * {
 *   "bufala": {
 *     "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *     "nome": "Mimosa",
 *     "brinco": "BR-12345"
 *   },
 *   "ciclo_atual": {
 *     "numero_ciclo": 3,
 *     "dias_em_lactacao": 145,
 *     "total_produzido": 1450.5,
 *     "media_diaria": 10.0
 *   },
 *   "comparativo_ciclos": [
 *     {
 *       "id_ciclo_lactacao": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
 *       "numero_ciclo": 1,
 *       "total_produzido": 2500,
 *       "duracao_dias": 305
 *     },
 *     {
 *       "id_ciclo_lactacao": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
 *       "numero_ciclo": 2,
 *       "total_produzido": 2800,
 *       "duracao_dias": 310
 *     }
 *   ],
 *   "grafico_producao": [
 *     { "data": "2025-01-01", "quantidade": 12.5 },
 *     { "data": "2025-01-02", "quantidade": 11.8 }
 *   ]
 * }
 */
export class ResumoProducaoBufalaDto {
  /**
   * Informações básicas de identificação da búfala.
   * Sempre retornado, independente do status reprodutivo ou lactação.
   */
  @ApiProperty({
    description: 'Dados de identificação da búfala',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'ID único da búfala no sistema',
      },
      nome: {
        type: 'string',
        description: 'Nome cadastrado da búfala',
      },
      brinco: {
        type: 'string',
        description: 'Código do brinco de identificação',
      },
    },
  })
  bufala: {
    /** ID único da búfala */
    id: string;
    /** Nome de registro */
    /** Nome de registro */
    nome: string;
    /** Código de identificação visual */
    brinco: string;
  };

  /**
   * Ciclo de lactação atualmente ativo.
   * NULL se a búfala estiver seca ou nunca teve partos.
   * Contém estatísticas acumuladas desde o parto mais recente.
   */
  @ApiProperty({
    description: 'Dados do ciclo de lactação atual (null se búfala estiver seca)',
    nullable: true,
    type: 'object',
    properties: {
      id_ciclo_lactacao: {
        type: 'string',
        format: 'uuid',
        description: 'ID do ciclo ativo',
      },
      numero_ciclo: {
        type: 'integer',
        description: 'Número sequencial do ciclo (1º parto = 1, 2º = 2...)',
        minimum: 1,
      },
      dt_parto: {
        type: 'string',
        format: 'date',
        description: 'Data do parto que iniciou este ciclo',
      },
      dias_em_lactacao: {
        type: 'integer',
        description: 'Dias decorridos desde o parto',
        minimum: 0,
      },
      total_produzido: {
        type: 'number',
        format: 'float',
        description: 'Total de litros produzidos neste ciclo',
        minimum: 0,
      },
      media_diaria: {
        type: 'number',
        format: 'float',
        description: 'Média de litros por controle leiteiro realizado (total_produzido / quantidade_de_ordenhas_registradas)',
        minimum: 0,
      },
      dt_secagem_prevista: {
        type: 'string',
        format: 'date',
        description: 'Data prevista para secagem (padrão 305 dias após parto)',
      },
      ultima_ordenha: {
        type: 'object',
        nullable: true,
        description: 'Dados da ordenha mais recente',
        properties: {
          data: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp da ordenha',
          },
          quantidade: {
            type: 'number',
            format: 'float',
            description: 'Litros ordenhados',
          },
          periodo: {
            type: 'string',
            enum: ['M', 'T', 'N'],
            description: 'Período (M=Manhã, T=Tarde, N=Noite)',
          },
        },
      },
    },
  })
  ciclo_atual: {
    /** ID único do ciclo */
    id_ciclo_lactacao: string;
    /** Número do ciclo (1, 2, 3...) */
    numero_ciclo: number;
    /** Data do parto */
    dt_parto: string;
    /** Dias desde o parto */
    dias_em_lactacao: number;
    /** Total acumulado (litros) */
    total_produzido: number;
    /** Média por controle leiteiro (litros/ordenha) */
    media_diaria: number;
    /** Data prevista de secagem */
    dt_secagem_prevista: string;
    /** Última ordenha registrada */
    ultima_ordenha: {
      data: string;
      quantidade: number;
      periodo: string;
    } | null;
  } | null;

  /**
   * Histórico de todos os ciclos de lactação anteriores.
   * Ordenado do mais antigo para o mais recente.
   * Útil para análise de tendências e comparação de desempenho.
   */
  @ApiProperty({
    description: 'Histórico comparativo de todos os ciclos anteriores finalizados (secos)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id_ciclo_lactacao: {
          type: 'string',
          format: 'uuid',
          description: 'ID único do ciclo de lactação - use para buscar ordenhas detalhadas via GET /lactacao/ciclo/{id_ciclo_lactacao}',
        },
        numero_ciclo: {
          type: 'integer',
          description: 'Número sequencial do ciclo (1, 2, 3...)',
        },
        dt_parto: {
          type: 'string',
          format: 'date',
          description: 'Data do parto que iniciou o ciclo',
        },
        dt_secagem: {
          type: 'string',
          format: 'date',
          nullable: true,
          description: 'Data em que a búfala foi seca (null se ciclo ativo)',
        },
        total_produzido: {
          type: 'number',
          format: 'float',
          description: 'Total de litros produzidos durante todo o ciclo',
          minimum: 0,
        },
        media_diaria: {
          type: 'number',
          format: 'float',
          description: 'Média de produção diária (total_produzido / duracao_dias)',
          minimum: 0,
        },
        duracao_dias: {
          type: 'integer',
          description: 'Duração do ciclo em dias (dt_secagem - dt_parto)',
        },
      },
    },
  })
  comparativo_ciclos: Array<{
    /** ID único do ciclo de lactação */
    id_ciclo_lactacao: string;
    /** Número do ciclo */
    numero_ciclo: number;
    /** Data do parto */
    dt_parto: string;
    /** Data da secagem (null se ciclo ativo) */
    dt_secagem: string | null;
    /** Total produzido no ciclo (litros) */
    total_produzido: number;
    /** Média diária (litros/dia) */
    media_diaria: number;
    /** Duração total (dias) */
    duracao_dias: number;
  }>;

  /**
   * Dados agregados para renderização de gráfico de linha.
   * Mostra a produção diária dos últimos 30 dias.
   * Cada entrada representa a soma das ordenhas de um dia específico.
   */
  @ApiProperty({
    description: 'Série temporal de produção diária (últimos 30 dias)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          format: 'date',
          description: 'Data da ordenha (formato YYYY-MM-DD)',
        },
        quantidade: {
          type: 'number',
          format: 'float',
          description: 'Total de litros ordenhados naquele dia',
          minimum: 0,
        },
      },
    },
  })
  grafico_producao: Array<{
    /** Data (YYYY-MM-DD) */
    data: string;
    /** Total do dia (litros) */
    quantidade: number;
  }>;
}
