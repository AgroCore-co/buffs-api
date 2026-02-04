/**
 * DTO para árvore genealógica simplificada (cálculo de categoria ABCB)
 * Usado internamente pelo módulo de rebanho para categorização
 */
export interface ArvoreGenealogicaDto {
  id_bufalo: string;
  id_raca: string | null;
  categoria: string | null;
  nome?: string;
  pai?: ArvoreGenealogicaDto | null;
  mae?: ArvoreGenealogicaDto | null;
  geracao: number;
}
