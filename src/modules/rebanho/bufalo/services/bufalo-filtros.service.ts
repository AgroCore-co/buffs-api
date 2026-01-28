import { Injectable, Logger } from '@nestjs/common';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { NivelMaturidade, SexoBufalo } from '../dto/create-bufalo.dto';

/**
 * Filtros aceitos para buscar búfalos.
 */
export interface BufaloFiltros {
  id_propriedade?: string;
  id_raca?: string;
  sexo?: SexoBufalo;
  nivel_maturidade?: NivelMaturidade;
  status?: boolean;
  brinco?: string;
  nome?: string;
  microchip?: string;
  id_grupo?: string;
}

/**
 * Opções de paginação para listagem de búfalos.
 */
export interface PaginacaoOpcoes {
  offset?: number;
  limit?: number;
}

/**
 * Resultado paginado de búfalos.
 */
export interface ResultadoPaginado<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Serviço de domínio para lógica de filtragem de búfalos.
 *
 * **Responsabilidades:**
 * - Centralizar toda lógica de filtros em um único lugar
 * - Eliminar duplicação dos 15 métodos find* do service original
 * - Fornecer interface consistente para buscar búfalos
 *
 * **Antes da refatoração:**
 * - 15 métodos diferentes (findByRaca, findByPropriedade, findBySexo, etc.)
 * - ~80% de código duplicado entre eles
 * - Difícil manter consistência
 *
 * **Depois da refatoração:**
 * - 1 método genérico `filtrarBufalos()`
 * - Código único e reutilizável
 * - Fácil adicionar novos filtros
 */
@Injectable()
export class BufaloFiltrosService {
  private readonly logger = new Logger(BufaloFiltrosService.name);

  constructor(private readonly bufaloRepo: BufaloRepositoryDrizzle) {}

  /**
   * **Método unificado de filtragem.**
   *
   * Substitui todos os 15 métodos find* anteriores:
   * - findByPropriedade()
   * - findByRaca()
   * - findBySexo()
   * - findByMaturidade()
   * - findByPropriedadeAndRaca()
   * - findByPropriedadeAndSexo()
   * - findByPropriedadeAndMaturidade()
   * - findByRacaAndSexo()
   * - findByRacaAndMaturidade()
   * - findBySexoAndMaturidade()
   * - findByPropriedadeRacaAndSexo()
   * - findByPropriedadeRacaAndMaturidade()
   * - findByPropriedadeSexoAndMaturidade()
   * - findByRacaSexoAndMaturidade()
   * - findByPropriedadeRacaSexoAndMaturidade()
   *
   * @param filtros Filtros a aplicar (qualquer combinação)
   * @param paginacao Opções de paginação
   * @returns Resultado paginado com búfalos e total
   *
   * @example
   * ```typescript
   * // Buscar fêmeas da propriedade X
   * await filtrarBufalos({ id_propriedade: 'abc', sexo: SexoBufalo.FEMEA });
   *
   * // Buscar búfalos da raça Murrah com paginação
   * await filtrarBufalos({ id_raca: 'murrah' }, { offset: 0, limit: 20 });
   *
   * // Buscar bezerros machos ativos
   * await filtrarBufalos({
   *   sexo: SexoBufalo.MACHO,
   *   nivel_maturidade: NivelMaturidade.BEZERRO,
   *   status: true
   * });
   * ```
   */
  async filtrarBufalos(filtros: BufaloFiltros, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    const offset = paginacao?.offset ?? 0;
    const limit = paginacao?.limit ?? 50;

    this.logger.debug(`Filtrando búfalos: ${JSON.stringify(filtros)}`);
    this.logger.debug(`Paginação: offset=${offset}, limit=${limit}`);

    try {
      // Busca dados e total em paralelo
      const [bufalosResponse, totalResponse] = await Promise.all([
        this.bufaloRepo.findWithFilters(filtros, { offset, limit }),
        this.bufaloRepo.countWithFilters(filtros),
      ]);

      const bufalos = bufalosResponse.data || [];
      const total = totalResponse.count || 0;

      this.logger.log(`✅ Encontrados ${bufalos.length} búfalos (total: ${total})`);

      return {
        data: bufalos,
        total,
        offset,
        limit,
      };
    } catch (error) {
      this.logger.error('Erro ao filtrar búfalos:', error);
      throw error;
    }
  }

  /**
   * Busca todos os búfalos de uma propriedade.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorPropriedade(id_propriedade: string, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_propriedade, status: true }, paginacao);
  }

  /**
   * Busca todos os búfalos de uma raça.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorRaca(id_raca: string, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_raca, status: true }, paginacao);
  }

  /**
   * Busca búfalos por sexo.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorSexo(sexo: SexoBufalo, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ sexo, status: true }, paginacao);
  }

  /**
   * Busca búfalos por nível de maturidade.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorMaturidade(nivel_maturidade: NivelMaturidade, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ nivel_maturidade, status: true }, paginacao);
  }

  /**
   * Busca búfalos por propriedade e raça.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorPropriedadeERaca(id_propriedade: string, id_raca: string, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_propriedade, id_raca, status: true }, paginacao);
  }

  /**
   * Busca búfalos por propriedade e sexo.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorPropriedadeESexo(id_propriedade: string, sexo: SexoBufalo, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_propriedade, sexo, status: true }, paginacao);
  }

  /**
   * Busca búfalos por propriedade e maturidade.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorPropriedadeEMaturidade(
    id_propriedade: string,
    nivel_maturidade: NivelMaturidade,
    paginacao?: PaginacaoOpcoes,
  ): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_propriedade, nivel_maturidade, status: true }, paginacao);
  }

  /**
   * Busca búfalos por raça e sexo.
   * Wrapper para compatibilidade com código antigo.
   */
  async buscarPorRacaESexo(id_raca: string, sexo: SexoBufalo, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    return this.filtrarBufalos({ id_raca, sexo, status: true }, paginacao);
  }

  /**
   * Busca búfalos por grupo de manejo.
   * Retorna todos os búfalos ativos associados ao grupo.
   */
  async buscarPorGrupo(id_grupo: string, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    this.logger.debug(`Buscando búfalos do grupo: ${id_grupo}`);
    return this.filtrarBufalos({ id_grupo, status: true }, paginacao);
  }

  /**
   * Busca búfalo por microchip (único).
   * Requer lista de propriedades que o usuário tem acesso.
   */
  async buscarPorMicrochip(microchip: string, id_propriedades: string[]): Promise<any | null> {
    this.logger.debug(`Buscando búfalo por microchip: ${microchip}`);
    return await this.bufaloRepo.findByMicrochip(microchip, id_propriedades);
  }

  /**
   * Busca búfalo por ID.
   */
  async buscarPorId(id_bufalo: string): Promise<any | null> {
    this.logger.debug(`Buscando búfalo por ID: ${id_bufalo}`);
    return await this.bufaloRepo.findById(id_bufalo);
  }

  /**
   * Busca búfalos por lista de IDs.
   */
  async buscarPorIds(ids: string[]): Promise<any[]> {
    this.logger.debug(`Buscando ${ids.length} búfalos por IDs`);
    return await this.bufaloRepo.findActiveByIds(ids);
  }
}
