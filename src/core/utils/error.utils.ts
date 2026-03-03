/**
 * Utilitários para tratamento type-safe de erros em blocos catch.
 *
 * Substitui o padrão inseguro `catch (error) { error.message }`
 * por acessos tipados com instanceof checks.
 *
 * @example
 * try { ... }
 * catch (error: unknown) {
 *   logger.error(getErrorMessage(error), getErrorStack(error));
 * }
 */

import { AxiosError } from 'axios';

/**
 * Extrai a mensagem de erro de forma type-safe.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Extrai o stack trace de forma type-safe.
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

/**
 * Type guard para erros do Axios (HttpService).
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof Error && 'response' in error && 'isAxiosError' in error;
}

/**
 * Extrai mensagem + stack em um único objeto (útil para LogContext).
 */
export function toErrorContext(error: unknown): { error: string; stack?: string } {
  return {
    error: getErrorMessage(error),
    stack: getErrorStack(error),
  };
}
