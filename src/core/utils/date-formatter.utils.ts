/**
 * Formata data ISO para padrão brasileiro (dd/MM/yyyy).
 * ⚠️ Use APENAS para exibição. Nunca para cálculos ou queries.
 */
export function formatToBrazilianDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return null;
  }
}

/**
 * Formata data ISO para padrão brasileiro com hora (dd/MM/yyyy HH:mm).
 */
export function formatToBrazilianDateTime(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    const date = new Date(isoDate);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

/**
 * Formata data ISO para YYYY-MM-DD (campos de data sem hora).
 */
export function formatToSimpleDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;

  try {
    return new Date(isoDate).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Formata campos de data automaticamente (dt_* → YYYY-MM-DD, *_at → dd/MM/yyyy HH:mm).
 * @example formatDateFields({ dt_registro: '2025-11-07T00:00:00Z' }) → { dt_registro: '2025-11-07' }
 */
export function formatDateFields<T extends Record<string, unknown>>(record: T, dateFields?: string[], dateTimeFields?: string[]): T {
  if (!record) return record;

  const formatted = { ...record } as Record<string, unknown>;

  // Formatar campos especificados como data simples
  if (dateFields) {
    dateFields.forEach((field) => {
      if (field in formatted) {
        formatted[field] = formatToSimpleDate(formatted[field] as string | null | undefined);
      }
    });
  } else {
    // Auto-detectar campos dt_* para data simples
    Object.keys(formatted).forEach((key) => {
      if (key.startsWith('dt_') && typeof formatted[key] === 'string') {
        formatted[key] = formatToSimpleDate(formatted[key]);
      }
    });
  }

  // Formatar campos especificados como data/hora
  if (dateTimeFields) {
    dateTimeFields.forEach((field) => {
      if (field in formatted) {
        formatted[field] = formatToBrazilianDateTime(formatted[field] as string | null | undefined);
      }
    });
  } else {
    // Auto-detectar campos *_at para data/hora brasileira
    Object.keys(formatted).forEach((key) => {
      if (key.endsWith('_at') && typeof formatted[key] === 'string') {
        formatted[key] = formatToBrazilianDateTime(formatted[key]);
      }
    });
  }

  return formatted as T;
}

/**
 * Aplica formatDateFields em array de registros.
 */
export function formatDateFieldsArray<T extends Record<string, unknown>>(records: T[], dateFields?: string[], dateTimeFields?: string[]): T[] {
  if (!records || !Array.isArray(records)) return records;
  return records.map((record) => formatDateFields(record, dateFields, dateTimeFields));
}
