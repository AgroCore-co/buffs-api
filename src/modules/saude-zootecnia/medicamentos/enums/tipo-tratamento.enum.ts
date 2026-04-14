export enum TipoTratamentoMedicacao {
  VACINACAO = 'VACINACAO',
  VERMIFUGACAO = 'VERMIFUGACAO',
  ANTIBIOTICO = 'ANTIBIOTICO',
  SUPLEMENTACAO = 'SUPLEMENTACAO',
  HORMONAL = 'HORMONAL',
  OUTRO = 'OUTRO',
}

const TIPO_TRATAMENTO_ALIASES: Record<TipoTratamentoMedicacao, string[]> = {
  [TipoTratamentoMedicacao.VACINACAO]: ['vacinacao', 'vacina', 'imunizacao'],
  [TipoTratamentoMedicacao.VERMIFUGACAO]: ['vermifugacao', 'vermifugo', 'antiparasitario'],
  [TipoTratamentoMedicacao.ANTIBIOTICO]: ['antibiotico', 'antibiotico-terapia'],
  [TipoTratamentoMedicacao.SUPLEMENTACAO]: ['suplementacao', 'suplemento'],
  [TipoTratamentoMedicacao.HORMONAL]: ['hormonal', 'hormonio', 'hormonoterapia'],
  [TipoTratamentoMedicacao.OUTRO]: ['outro'],
};

function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const ALIAS_TO_ENUM = new Map<string, TipoTratamentoMedicacao>();

for (const tipo of Object.values(TipoTratamentoMedicacao)) {
  ALIAS_TO_ENUM.set(normalizeToken(tipo), tipo);

  for (const alias of TIPO_TRATAMENTO_ALIASES[tipo]) {
    ALIAS_TO_ENUM.set(normalizeToken(alias), tipo);
  }
}

export function normalizeTipoTratamento(value: unknown): TipoTratamentoMedicacao | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = normalizeToken(value);
  if (!normalized) {
    return undefined;
  }

  return ALIAS_TO_ENUM.get(normalized);
}

export function getTipoTratamentoAliases(tipo: TipoTratamentoMedicacao): string[] {
  return [...TIPO_TRATAMENTO_ALIASES[tipo]];
}
