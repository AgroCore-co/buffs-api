/**
 * Utilitários para trabalhar com Drizzle ORM
 */

/**
 * Remove campos `undefined` de um objeto, convertendo-os para `null`.
 * Drizzle ORM requer `null` ao invés de `undefined` para campos opcionais.
 *
 * @param obj Objeto com possíveis valores undefined
 * @returns Objeto com undefined convertido para null
 *
 * @example
 * const data = sanitizeForDrizzle({
 *   nome: 'João',
 *   idade: undefined,
 *   cidade: null
 * });
 * // Resultado: { nome: 'João', idade: null, cidade: null }
 */
export function sanitizeForDrizzle<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Converte undefined para null, mantém outros valores (inclusive null explícito)
      sanitized[key] = obj[key] ?? null;
    }
  }

  return sanitized;
}

/**
 * Remove campos que são undefined de um objeto (não os converte, apenas remove).
 * Útil para updates parciais onde você quer ignorar campos não fornecidos.
 *
 * @param obj Objeto com possíveis valores undefined
 * @returns Objeto sem campos undefined
 *
 * @example
 * const data = removeUndefined({
 *   nome: 'João',
 *   idade: undefined,
 *   cidade: 'SP'
 * });
 * // Resultado: { nome: 'João', cidade: 'SP' }
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned = {} as Partial<T>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
  }

  return cleaned;
}
