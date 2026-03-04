/**
 * Interface para o usuário autenticado via Supabase.
 *
 * Representa a estrutura do payload JWT decodificado
 * pelo `SupabaseAuthGuard` e injetado via decorador `@User()`.
 */
export interface AuthenticatedUser {
  /** UUID do usuário no Supabase Auth */
  id: string;

  /** E-mail do usuário */
  email?: string;

  /** Subject do JWT (geralmente igual ao id) */
  sub?: string;

  /** Propriedades adicionais do token Supabase */
  [key: string]: unknown;
}
