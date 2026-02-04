/**
 * Constantes de TTL (Time To Live) para cache em milissegundos.
 * Centraliza todos os valores de cache para facilitar ajustes e manutenção.
 */

export const CacheTTL = {
  /**
   * Cache de curta duração (30 segundos)
   * Usado para dados que mudam frequentemente mas precisam de cache para performance
   * Exemplo: propriedades do usuário, dados de sessão
   */
  SHORT: 30 * 1000, // 30 segundos

  /**
   * Cache de média duração (5 minutos)
   * Usado para dados que mudam ocasionalmente
   * Exemplo: listas de búfalos, relatórios
   */
  MEDIUM: 5 * 60 * 1000, // 5 minutos

  /**
   * Cache de longa duração (30 minutos)
   * Usado para dados que raramente mudam
   * Exemplo: raças, categorias ABCB, medicações
   */
  LONG: 30 * 60 * 1000, // 30 minutos

  /**
   * Cache de muito longa duração (1 hora)
   * Usado para dados que quase nunca mudam
   * Exemplo: configurações do sistema, dados estáticos
   */
  VERY_LONG: 60 * 60 * 1000, // 1 hora

  /**
   * Cache padrão (5 minutos)
   * Usado quando não especificado
   */
  DEFAULT: 5 * 60 * 1000, // 5 minutos
} as const;

/**
 * Chaves de cache padronizadas.
 * Facilita a invalidação e organização do cache.
 */
export const CacheKeys = {
  /**
   * Gera chave de cache para propriedades de um usuário
   */
  userProperties: (userId: string) => `user_props:${userId}`,

  /**
   * Gera chave de cache para dados de um búfalo
   */
  bufalo: (bufaloId: string) => `bufalo:${bufaloId}`,

  /**
   * Gera chave de cache para lista de búfalos de uma propriedade
   */
  bufalosList: (propriedadeId: string) => `bufalos_list:${propriedadeId}`,

  /**
   * Gera chave de cache para raças
   */
  racas: () => `racas:all`,

  /**
   * Gera chave de cache para grupos de uma propriedade
   */
  grupos: (propriedadeId: string) => `grupos:${propriedadeId}`,
} as const;
