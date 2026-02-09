import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta para listagem de fêmeas disponíveis para reprodução.
 *
 * Critérios de disponibilidade:
 * - Idade mínima: 18 meses
 * - Sem cobertura ativa (aguardando diagnóstico ou confirmada)
 * - Período pós-parto >= 60 dias (se houver lactação)
 *
 * Utilizado para planejar acasalamentos e monitorar ciclos reprodutivos.
 *
 * @example
 * {
 *   "id_bufalo": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   "nome": "Valente",
 *   "brinco": "BR-54321",
 *   "idade_meses": 36,
 *   "raca": "Jafarabadi",
 *   "ultima_cobertura": "2024-05-15",
 *   "dias_desde_ultima_cobertura": 120,
 *   "status_reprodutivo": "Disponível",
 *   "ciclo_atual": {
 *     "numero_ciclo": 2,
 *     "dias_em_lactacao": 180,
 *     "status": "Em Lactação"
 *   },
 *   "recomendacoes": [
 *     "Búfala apta para nova cobertura",
 *     "Produção leiteira estável"
 *   ]
 * }
 */
export class FemeaDisponivelReproducaoDto {
  /**
   * ID único da búfala no sistema.
   * Utilizado para registrar nova cobertura.
   */
  @ApiProperty({
    description: 'ID único da búfala no sistema',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  idBufalo: string;

  /**
   * Nome de registro da búfala.
   */
  @ApiProperty({
    description: 'Nome cadastrado da búfala',
    example: 'Valente',
  })
  nome: string;

  /**
   * Código do brinco de identificação visual.
   * Facilita localização física no rebanho.
   */
  @ApiProperty({
    description: 'Código do brinco de identificação',
    example: 'BR-54321',
  })
  brinco: string;

  /**
   * Idade calculada em meses a partir da data de nascimento.
   * Mínimo de 18 meses para aparecer nesta lista.
   */
  @ApiProperty({
    description: 'Idade em meses (mínimo 18 para reprodução)',
    minimum: 18,
    example: 36,
  })
  idadeMeses: number;

  /**
   * Nome da raça conforme cadastro.
   * Importante para planejamento genético.
   */
  @ApiProperty({
    description: 'Nome da raça da búfala',
    example: 'Jafarabadi',
  })
  raca: string;

  /**
   * Data da última cobertura registrada (pode ser de anos anteriores).
   * NULL se nunca houve cobertura.
   */
  @ApiProperty({
    description: 'Data da última cobertura registrada (null se nunca coberta)',
    format: 'date',
    example: '2024-05-15',
    nullable: true,
  })
  ultima_cobertura: string | null;

  /**
   * Dias decorridos desde a última cobertura.
   * NULL se nunca houve cobertura.
   * Útil para calcular intervalo entre partos (IEP).
   */
  @ApiProperty({
    description: 'Dias desde a última cobertura (null se nunca coberta)',
    example: 120,
    nullable: true,
    minimum: 0,
  })
  dias_desde_ultima_cobertura: number | null;

  /**
   * Status reprodutivo avaliado pelo sistema.
   *
   * - "Disponível": Pode ser coberta imediatamente
   * - "Período Pós-Parto": Menos de 60 dias desde o parto, aguardar involução uterina
   * - "Aguardando Diagnóstico": Cobertura recente sem confirmação
   */
  @ApiProperty({
    description: 'Status reprodutivo atual baseado em regras de negócio',
    enum: ['Disponível', 'Período Pós-Parto', 'Aguardando Diagnóstico'],
    example: 'Disponível',
  })
  status_reprodutivo: string;

  /**
   * Informações do ciclo de lactação ativo (se houver).
   * NULL se a búfala estiver seca ou nunca pariu.
   * Usado para avaliar impacto da gestação na produção leiteira.
   */
  @ApiProperty({
    description: 'Dados do ciclo de lactação atual (null se seca)',
    nullable: true,
    type: 'object',
    properties: {
      numero_ciclo: {
        type: 'integer',
        description: 'Número sequencial do ciclo de lactação',
        minimum: 1,
      },
      dias_em_lactacao: {
        type: 'integer',
        description: 'Dias desde o parto do ciclo atual',
        minimum: 0,
      },
      status: {
        type: 'string',
        enum: ['Em Lactação', 'Seca'],
        description: 'Status do ciclo',
      },
    },
  })
  ciclo_atual: {
    /** Número do ciclo (1, 2, 3...) */
    numero_ciclo: number;
    /** Dias desde o parto */
    dias_em_lactacao: number;
    /** Status (Em Lactação/Seca) */
    status: string;
  } | null;

  /**
   * Lista de recomendações geradas pelo sistema.
   * Baseadas em idade, última cobertura, lactação e histórico.
   *
   * Exemplos:
   * - "Búfala apta para nova cobertura"
   * - "Aguardar mais 30 dias (período pós-parto)"
   * - "Primeira cobertura - avaliar desenvolvimento corporal"
   */
  @ApiProperty({
    description: 'Recomendações para manejo reprodutivo',
    type: 'array',
    items: {
      type: 'string',
      description: 'Recomendação específica gerada pelo sistema',
    },
    example: ['Búfala apta para nova cobertura', 'Produção leiteira estável'],
  })
  recomendacoes: string[];
}
