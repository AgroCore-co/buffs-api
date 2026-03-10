import { Injectable, Logger } from '@nestjs/common';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { NivelMaturidade, SexoBufalo } from '../dto/create-bufalo.dto';

/**
 * Filtros aceitos para buscar búfalos.
 */
export interface BufaloFiltros {
  idPropriedade?: string | string[];
  idRaca?: string;
  sexo?: SexoBufalo;
  nivelMaturidade?: NivelMaturidade;
  status?: boolean;
  brinco?: string;
  nome?: string;
  microchip?: string;
  idGrupo?: string;
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
   * await filtrarBufalos({ idPropriedade: 'abc', sexo: SexoBufalo.FEMEA });
   *
   * // Buscar búfalos da raça Murrah com paginação
   * await filtrarBufalos({ idRaca: 'murrah' }, { offset: 0, limit: 20 });
   *
   * // Buscar bezerros machos ativos
   * await filtrarBufalos({
   *   sexo: SexoBufalo.MACHO,
   *   nivelMaturidade: NivelMaturidade.BEZERRO,
   *   status: true
   * });
   * ```
   */
  async filtrarBufalos(filtros: BufaloFiltros, paginacao?: PaginacaoOpcoes): Promise<ResultadoPaginado<any>> {
    const offset = paginacao?.offset ?? 0;
    const limit = paginacao?.limit ?? 50;

    this.logger.debug(`Filtrando búfalos: ${JSON.stringify(filtros)}`);
    this.logger.debug(`Paginação: offset=${offset}, limit=${limit}`);

    // Map camelCase BufaloFiltros to the snake_case shape expected by the repository
    const repoFiltros = {
      id_propriedade: filtros.idPropriedade,
      id_raca: filtros.idRaca,
      sexo: filtros.sexo,
      nivel_maturidade: filtros.nivelMaturidade,
      status: filtros.status,
      brinco: filtros.brinco,
      nome: filtros.nome,
      microchip: filtros.microchip,
      id_grupo: filtros.idGrupo,
    };

    try {
      // Busca dados e total em paralelo
      const [bufalosResponse, totalResponse] = await Promise.all([
        this.bufaloRepo.findWithFilters(repoFiltros, { offset, limit }),
        this.bufaloRepo.countWithFilters(repoFiltros),
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
   * Busca búfalo por microchip (único).
   * Requer lista de propriedades que o usuário tem acesso.
   */
  async buscarPorMicrochip(microchip: string, idPropriedades: string[]): Promise<any | null> {
    this.logger.debug(`Buscando búfalo por microchip: ${microchip}`);
    return await this.bufaloRepo.findByMicrochip(microchip, idPropriedades);
  }
}
