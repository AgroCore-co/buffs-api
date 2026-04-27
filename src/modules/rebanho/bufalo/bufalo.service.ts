import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { FiltroBufaloDto } from './dto/filtro-bufalo.dto';
import { InativarBufaloDto } from './dto/inativar-bufalo.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { LoggerService } from '../../../core/logger/logger.service';
import { formatDateFields } from '../../../core/utils/date-formatter.utils';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService } from '../../../core/cache/cache.service';

import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from './repositories/usuario-propriedade.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';

/**
 * Serviço principal para gerenciamento de búfalos.
 *
 * Este serviço é responsável por todas as operações CRUD relacionadas a búfalos,
 * incluindo:
 * - Cadastro e atualização de búfalos
 * - Consultas com filtros avançados e paginação
 * - Cálculo automático de maturidade baseado em idade e sexo
 * - Cálculo automático de categoria ABCB baseado em genealogia
 * - Soft-delete (inativação) ao invés de exclusão física
 * - Validações de genealogia (evita ciclos e inconsistências)
 * - Gestão de grupos de búfalos
 * - Enriquecimento de dados com informações genealógicas e de raça
 *
 * **Arquitetura:**
 * - Delega cálculos de maturidade para {@link BufaloMaturidadeService}
 * - Delega cálculos de categoria ABCB para {@link BufaloCategoriaService}
 * - Delega filtros complexos para {@link BufaloFiltrosService}
 * - Delega validações de acesso para {@link AuthHelperService}
 * - Utiliza {@link BufaloRepositoryDrizzle} para persistência
 *
 * **Regras de Negócio:**
 * - Búfalos com mais de 50 anos são automaticamente inativados
 * - Maturidade é calculada baseada em idade e sexo (Bezerro, Novilho/Novilha, Vaca, Touro)
 * - Categoria ABCB é calculada baseada na genealogia até 4 gerações
 * - Usuários só podem acessar búfalos de propriedades vinculadas
 *
 * @class BufaloService
 * @implements {ISoftDelete}
 */
@Injectable()
export class BufaloService implements ISoftDelete {
  constructor(
    private readonly genealogiaService: GenealogiaService,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
    private readonly usuarioPropriedadeRepo: UsuarioPropriedadeRepositoryDrizzle,
    private readonly maturidadeService: BufaloMaturidadeService,
    private readonly categoriaService: BufaloCategoriaService,
    private readonly filtrosService: BufaloFiltrosService,
    private readonly authHelper: AuthHelperService,
    private readonly loggerService: LoggerService,
    private readonly cacheService: CacheService,
  ) {}

  // ==================== AUTENTICAÇÃO E AUTORIZAÇÃO ====================

  /**
   * Invalida cache de propriedades do usuário.
   * Delegado ao AuthHelperService.
   */
  async invalidarCachePropriedades(userId: string): Promise<void> {
    await this.authHelper.invalidarCachePropriedades(userId);
  }

  /**
   * Invalida cache HTTP e demais chaves em memória compartilhada.
   */
  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }

  /**
   * Valida se o usuário tem acesso ao búfalo através das propriedades vinculadas.
   *
   * Verifica se:
   * 1. O búfalo existe no banco de dados
   * 2. O búfalo está vinculado a uma propriedade
   * 3. O usuário tem acesso à propriedade do búfalo (como dono ou funcionário)
   *
   * @param bufaloId - ID do búfalo a ser validado
   * @param userId - ID do usuário que está tentando acessar
   * @throws {NotFoundException} Se o búfalo não existir ou não tiver propriedade vinculada
   * @throws {NotFoundException} Se o usuário não tiver acesso à propriedade
   * @private
   */
  private async validateBufaloAccess(bufaloId: string, userId: string): Promise<void> {
    const bufalo = await this.bufaloRepo.findById(bufaloId);

    if (!bufalo?.idPropriedade) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado.`);
    }

    await this.authHelper.validatePropriedadeAccess(userId, bufalo.idPropriedade);
  }

  /**
   * Valida acesso ao búfalo incluindo registros removidos logicamente.
   * Necessário para operações de restore.
   */
  private async validateBufaloAccessIncludingDeleted(bufaloId: string, userId: string): Promise<any> {
    const bufalo = await this.bufaloRepo.findByIdIncludingDeleted(bufaloId);

    if (!bufalo?.idPropriedade) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado.`);
    }

    await this.authHelper.validatePropriedadeAccess(userId, bufalo.idPropriedade);
    return bufalo;
  }

  /**
   * Valida se o usuário tem acesso a uma propriedade específica.
   *
   * Delega a validação para o {@link AuthHelperService} que verifica se o usuário
   * é dono ou funcionário da propriedade.
   *
   * @param id_propriedade - ID da propriedade a ser validada
   * @param userId - ID do usuário que está tentando acessar
   * @throws {NotFoundException} Se o usuário não tiver acesso à propriedade
   * @private
   */
  private async validatePropriedadeAccess(id_propriedade: string, userId: string): Promise<void> {
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);
  }
  // ==================== CAMPOS DERIVADOS (ISSUE #6) ====================

  /**
   * Enriquece o objeto búfalo com campos derivados de genealogia e raça.
   *
   * **Campos expostos:**
   * - nomeRaca: Nome da raça (direto do join)
   * - brincoPai: Brinco do pai (prioridade: animal interno → animal origem do material genético → identificador do material)
   * - brincoMae: Brinco da mãe (mesma lógica do pai)
   * - materialGeneticoMachoNome: Nome/identificador do material genético masculino (apenas se não houver pai interno)
   * - materialGeneticoFemeaNome: Nome/identificador do material genético feminino (apenas se não houver mãe interna)
   *
   * @param bufalo Objeto búfalo com relacionamentos carregados
   * @returns Objeto búfalo enriquecido com campos derivados
   */
  private enrichBufaloWithDerivedFields(bufalo: any): any {
    if (!bufalo) return null;

    // nomeRaca - direto do join
    const nomeRaca = bufalo.raca?.nome || null;

    // brincoPai - Prioridade: pai interno → animal origem do sêmen → identificador do material
    let brincoPai = null;
    if (bufalo.bufalo_idPai) {
      brincoPai = bufalo.bufalo_idPai.brinco;
    } else if (bufalo.materialgenetico_idPaiSemen) {
      if (bufalo.materialgenetico_idPaiSemen.bufalo) {
        brincoPai = bufalo.materialgenetico_idPaiSemen.bufalo.brinco;
      } else {
        brincoPai = bufalo.materialgenetico_idPaiSemen.identificador;
      }
    }

    // brincoMae - Prioridade: mãe interna → animal origem do óvulo → identificador do material
    let brincoMae = null;
    if (bufalo.bufalo_idMae) {
      brincoMae = bufalo.bufalo_idMae.brinco;
    } else if (bufalo.materialgenetico_idMaeOvulo) {
      if (bufalo.materialgenetico_idMaeOvulo.bufalo) {
        brincoMae = bufalo.materialgenetico_idMaeOvulo.bufalo.brinco;
      } else {
        brincoMae = bufalo.materialgenetico_idMaeOvulo.identificador;
      }
    }

    // materialGeneticoMachoNome - Apenas se não houver pai interno
    let materialGeneticoMachoNome = null;
    if (!bufalo.bufalo_idPai && bufalo.materialgenetico_idPaiSemen) {
      materialGeneticoMachoNome = bufalo.materialgenetico_idPaiSemen.identificador;
    }

    // materialGeneticoFemeaNome - Apenas se não houver mãe interna
    let materialGeneticoFemeaNome = null;
    if (!bufalo.bufalo_idMae && bufalo.materialgenetico_idMaeOvulo) {
      materialGeneticoFemeaNome = bufalo.materialgenetico_idMaeOvulo.identificador;
    }

    // Retorna objeto enriquecido (remove objetos de relacionamento para limpar resposta)
    const { bufalo_idPai, bufalo_idMae, materialgenetico_idPaiSemen, materialgenetico_idMaeOvulo, ...bufaloLimpo } = bufalo;

    return {
      ...bufaloLimpo,
      nomeRaca,
      brincoPai,
      brincoMae,
      materialGeneticoMachoNome,
      materialGeneticoFemeaNome,
    };
  }

  /**
   * Enriquece múltiplos búfalos com campos derivados (OTIMIZADO).
   * Carrega todos os pais/mães em UMA query ao invés de N queries.
   * Resolve N+1 query problem.
   *
   * @param bufalos Array de búfalos
   * @returns Array de búfalos enriquecidos
   */
  private async enrichBufalosWithDerivedFieldsBatch(bufalos: any[]): Promise<any[]> {
    if (!bufalos || bufalos.length === 0) return [];

    // 1. Coletar todos os IDs únicos de pais e mães
    const parentIds = new Set<string>();
    bufalos.forEach((b) => {
      if (b.idPai) parentIds.add(b.idPai);
      if (b.idMae) parentIds.add(b.idMae);
    });

    // 2. Buscar todos os pais/mães em UMA query usando método específico
    const parentsArray = parentIds.size > 0 ? await this.bufaloRepo.findActiveByIds(Array.from(parentIds)) : [];

    // 3. Criar mapa para acesso O(1)
    const parentsMap = new Map<string, any>(parentsArray.map((p) => [p.idBufalo, p]));

    // 4. Enriquecer cada búfalo usando o mapa
    return bufalos.map((bufalo) => {
      const nomeRaca = bufalo.raca?.nome || null;

      // Brinco do pai
      let brincoPai = null;
      if (bufalo.idPai) {
        const pai = parentsMap.get(bufalo.idPai);
        brincoPai = pai?.brinco || bufalo.materialgenetico_idPaiSemen?.bufalo?.brinco || bufalo.materialgenetico_idPaiSemen?.identificador || null;
      } else if (bufalo.materialgenetico_idPaiSemen) {
        brincoPai = bufalo.materialgenetico_idPaiSemen.bufalo?.brinco || bufalo.materialgenetico_idPaiSemen.identificador;
      }

      // Brinco da mãe
      let brincoMae = null;
      if (bufalo.idMae) {
        const mae = parentsMap.get(bufalo.idMae);
        brincoMae = mae?.brinco || bufalo.materialgenetico_idMaeOvulo?.bufalo?.brinco || bufalo.materialgenetico_idMaeOvulo?.identificador || null;
      } else if (bufalo.materialgenetico_idMaeOvulo) {
        brincoMae = bufalo.materialgenetico_idMaeOvulo.bufalo?.brinco || bufalo.materialgenetico_idMaeOvulo.identificador;
      }

      // Material genético (apenas se não houver pai/mãe interno)
      let materialGeneticoMachoNome = null;
      if (!bufalo.idPai && bufalo.materialgenetico_idPaiSemen) {
        materialGeneticoMachoNome = bufalo.materialgenetico_idPaiSemen.identificador;
      }

      let materialGeneticoFemeaNome = null;
      if (!bufalo.idMae && bufalo.materialgenetico_idMaeOvulo) {
        materialGeneticoFemeaNome = bufalo.materialgenetico_idMaeOvulo.identificador;
      }

      const { bufalo_idPai, bufalo_idMae, materialgenetico_idPaiSemen, materialgenetico_idMaeOvulo, ...bufaloLimpo } = bufalo;

      return {
        ...bufaloLimpo,
        nomeRaca,
        brincoPai,
        brincoMae,
        materialGeneticoMachoNome,
        materialGeneticoFemeaNome,
      };
    });
  }

  // ==================== CRUD OPERATIONS ====================
  /**
   * Valida se o grupo existe e se o usuário tem acesso através das propriedades vinculadas.
   */
  private async validateGrupoAccess(id_grupo: string, userId: string): Promise<void> {
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const grupo = await this.usuarioPropriedadeRepo.buscarGrupoPorId(id_grupo, propriedadesUsuario);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id_grupo} não encontrado ou você não tem acesso a ele.`);
    }
  }

  // ==================== HELPERS ====================

  /**
   * Método auxiliar que centraliza o fluxo padrão das rotas de listagem paginada:
   * 1. Extrai paginação
   * 2. Obtém userId e valida acesso à propriedade
   * 3. Filtra via filtrosService
   * 4. Atualiza maturidade
   * 5. Enriquece com campos derivados
   * 6. Retorna resposta paginada
   */
  private async buscarComFiltrosPaginado(
    filtros: import('./services/bufalo-filtros.service').BufaloFiltros,
    user: any,
    paginationDto: PaginationDto = {},
    idPropriedade?: string,
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.authHelper.getUserId(user);

    if (idPropriedade) {
      await this.validatePropriedadeAccess(idPropriedade, userId);
    }

    const resultado = await this.filtrosService.filtrarBufalos(filtros, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const bufalosEnriquecidos = await this.enrichBufalosWithDerivedFieldsBatch(resultado.data);

    return createPaginatedResponse(bufalosEnriquecidos, resultado.total, page, limit);
  }

  // ==================== CRUD BÁSICO ====================

  /**
   * Valida genealogia para prevenir circularidade.
   * @throws BadRequestException se detectar circularidade
   */
  private async validarGenealogiaCircular(bufaloId: string | undefined, idPai: string | undefined, idMae: string | undefined): Promise<void> {
    // 1. Búfalo não pode ser pai/mãe de si mesmo
    if (bufaloId && (bufaloId === idPai || bufaloId === idMae)) {
      throw new BadRequestException('Búfalo não pode ser pai ou mãe de si mesmo');
    }

    // 2. Pai e mãe não podem ser o mesmo animal
    if (idPai && idMae && idPai === idMae) {
      throw new BadRequestException('Pai e mãe não podem ser o mesmo animal');
    }

    // 3. Verificar se os pais não são descendentes do próprio búfalo (apenas em updates)
    if (bufaloId && idPai) {
      const descendentes = await this.bufaloRepo.findChildrenIds(bufaloId);
      if (descendentes.includes(idPai)) {
        throw new BadRequestException('Circularidade detectada: pai é descendente do búfalo');
      }
    }

    if (bufaloId && idMae) {
      const descendentes = await this.bufaloRepo.findChildrenIds(bufaloId);
      if (descendentes.includes(idMae)) {
        throw new BadRequestException('Circularidade detectada: mãe é descendente do búfalo');
      }
    }
  }

  /**
   * Cria novo búfalo com cálculo automático de maturidade e categoria ABCB.
   *
   * **Fluxo de Criação:**
   * 1. Valida acesso do usuário à propriedade
   * 2. Valida genealogia (previne ciclos)
   * 3. Calcula maturidade automaticamente baseado em dtNascimento e sexo
   * 4. Calcula categoria ABCB se houver genealogia (até 4 gerações)
   * 5. Persiste no banco de dados
   *
   * **Cálculos Automáticos:**
   * - **Maturidade**: Bezerro (0-12m), Novilho/Novilha (12-24m), Vaca/Touro (>24m)
   * - **Categoria ABCB**: PO, PC, PA, CCG ou SRD baseado em genealogia
   * - **Status**: false se idade > 50 anos
   *
   * @param createDto - Dados do búfalo a ser criado
   * @param user - Usuário autenticado (do JWT)
   * @returns Búfalo criado com todos os campos calculados
   * @throws {NotFoundException} Se propriedade não existir ou usuário não ter acesso
   * @throws {BadRequestException} Se genealogia for circular
   * @throws {InternalServerErrorException} Se houver erro na persistência
   */
  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.authHelper.getUserId(user);

    const dadosCriacao = {
      nome: createDto.nome,
      brinco: createDto.brinco,
      microchip: createDto.microchip,
      dt_nascimento: createDto.dtNascimento,
      nivel_maturidade: createDto.nivelMaturidade,
      sexo: createDto.sexo,
      data_baixa: undefined,
      status: createDto.status,
      motivo_inativo: undefined,
      id_raca: createDto.idRaca,
      id_propriedade: createDto.idPropriedade,
      id_grupo: createDto.idGrupo,
      origem: createDto.origem,
      brinco_original: createDto.brinco_original,
      registro_prov: createDto.registro_prov,
      registro_def: createDto.registro_def,
      categoria: createDto.categoria,
      id_pai: createDto.idPai,
      id_mae: createDto.idMae,
      id_pai_semen: createDto.id_pai_semen,
      id_mae_ovulo: createDto.id_mae_ovulo,
    };

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(dadosCriacao.id_propriedade, userId);

    // Valida genealogia (previne circularidade)
    await this.validarGenealogiaCircular(undefined, dadosCriacao.id_pai, dadosCriacao.id_mae);

    try {
      // 1. Processa maturidade automaticamente
      const dadosComMaturidade = this.maturidadeService.processarDadosMaturidade(dadosCriacao);

      // 2. Calcula categoria ABCB se tiver genealogia
      let dadosFinais = { ...dadosComMaturidade };

      if (dadosCriacao.id_pai || dadosCriacao.id_mae) {
        // Constrói árvore genealógica a partir dos dados fornecidos (sem buscar búfalo inexistente)
        const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoriaFromData(
          dadosCriacao.id_raca ?? null,
          dadosCriacao.id_pai,
          dadosCriacao.id_mae,
          1,
        );

        if (arvoreGenealogica) {
          // Verifica se propriedade participa ABCB
          const propriedade = await this.usuarioPropriedadeRepo.buscarPropriedadePorId(dadosCriacao.id_propriedade);

          const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, propriedade?.pAbcb || false);
          dadosFinais = { ...dadosFinais, categoria };
        }
      }

      // 3. Cria no banco
      const novoBufalo = await this.bufaloRepo.create(dadosFinais);
      await this.invalidateCache();

      this.loggerService.log(`Búfalo criado: ${novoBufalo.nome || novoBufalo.brinco}`, { service: 'BufaloService', method: 'create' });
      return novoBufalo;
    } catch (error) {
      this.loggerService.logError(error, { service: 'BufaloService', method: 'create' });
      throw error;
    }
  }

  /**
   * Lista todos os búfalos das propriedades do usuário com paginação.
   *
   * **Comportamento:**
   * - Busca búfalos de todas as propriedades vinculadas ao usuário
   * - Exclui búfalos removidos logicamente (deleted_at não nulo)
   * - Aplica enriquecimento de campos (nomeRaca, brincoPai, brincoMae)
   * - Atualiza maturidade automaticamente se necessário
   * - Utiliza método otimizado para prevenir N+1 queries
   *
   * **Ordenação:**
   * - Prioriza búfalos ativos (status = true)
   * - Ordena por data de nascimento (mais antigos primeiro)
   *
   * **Performance:**
   * - Usa batch loading para carregar pais/mães em uma única query
   * - Cache implementado no nível do repository para propriedades do usuário
   *
   * @param user - Usuário autenticado (do JWT)
   * @param paginationDto - Parâmetros de paginação (page, limit)
   * @returns Resposta paginada com lista de búfalos enriquecidos
   * @throws {NotFoundException} Se usuário não tiver propriedades vinculadas
   */
  async findAll(user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const resultado = await this.filtrosService.filtrarBufalos({ idPropriedade: propriedadesUsuario as any, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const bufalosEnriquecidos = await this.enrichBufalosWithDerivedFieldsBatch(resultado.data);

    return createPaginatedResponse(bufalosEnriquecidos, resultado.total, page, limit);
  }

  /**
   * Busca búfalo por ID.
   */
  async findOne(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Busca dados com joins (já inclui relacionamentos genealógicos)
    const bufalo = await this.bufaloRepo.findById(id);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario([bufalo]);

    // Enriquece com campos derivados (Issue #6)
    return this.enrichBufaloWithDerivedFields(bufalo);
  }

  /**
   * Busca búfalos por propriedade com paginação.
   */
  async findByPropriedade(id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, status: true }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por raça em uma propriedade.
   */
  async findByRaca(id_raca: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, idRaca: id_raca, status: true }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por sexo em uma propriedade.
   */
  async findBySexo(sexo: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, sexo: sexo as any, status: true }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por nível de maturidade.
   */
  async findByMaturidade(
    nivel_maturidade: string,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      { idPropriedade: id_propriedade, nivelMaturidade: nivel_maturidade as any, status: true },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalos por grupo de manejo.
   * Retorna todos os búfalos ativos associados ao grupo específico.
   */
  async findByGrupo(id_grupo: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.authHelper.getUserId(user);
    await this.validateGrupoAccess(id_grupo, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ idGrupo: id_grupo, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    const bufalosEnriquecidos = await this.enrichBufalosWithDerivedFieldsBatch(resultado.data);

    return createPaginatedResponse(bufalosEnriquecidos, resultado.total, page, limit);
  }

  /**
   * Busca búfalos com filtros combinados.
   * Compatibilidade com controller: aceita id_propriedade como primeiro parâmetro.
   */
  async findByFiltros(
    id_propriedade: string,
    filtroDto: FiltroBufaloDto,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      {
        idPropriedade: id_propriedade,
        idRaca: filtroDto.idRaca,
        sexo: filtroDto.sexo,
        nivelMaturidade: filtroDto.nivelMaturidade,
        status: filtroDto.status !== undefined ? filtroDto.status : true,
        brinco: filtroDto.brinco,
      },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalo por microchip.
   */
  async findByMicrochip(microchip: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    // Delega para service de filtros
    const bufalo = await this.filtrosService.buscarPorMicrochip(microchip, propriedadesUsuario);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo com microchip ${microchip} não encontrado nas suas propriedades.`);
    }

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario([bufalo]);

    return bufalo;
  }

  /**
   * Atualiza búfalo.
   */
  async update(id: string, updateDto: UpdateBufaloDto, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    const houveAlteracaoGenealogia = updateDto.idPai !== undefined || updateDto.idMae !== undefined || updateDto.idRaca !== undefined;

    // Busca dados atuais uma única vez (reusado por genealogia, maturidade e categoria)
    const precisaDados =
      houveAlteracaoGenealogia || updateDto.dtNascimento !== undefined || updateDto.sexo !== undefined || updateDto.idPropriedade !== undefined;
    const bufaloAtual = precisaDados ? await this.bufaloRepo.findByIdIncludingDeleted(id) : null;

    // Valida genealogia se houver mudança de pai/mãe
    if (updateDto.idPai !== undefined || updateDto.idMae !== undefined) {
      await this.validarGenealogiaCircular(
        id,
        updateDto.idPai !== undefined ? updateDto.idPai : bufaloAtual?.idPai,
        updateDto.idMae !== undefined ? updateDto.idMae : bufaloAtual?.idMae,
      );
    }

    // Se mudou data de nascimento ou sexo, recalcula maturidade
    let dadosAtualizados = { ...updateDto };

    if (updateDto.dtNascimento !== undefined || updateDto.sexo !== undefined) {
      const dadosCompletos = {
        ...bufaloAtual,
        ...updateDto,
      };

      dadosAtualizados = this.maturidadeService.processarDadosMaturidade(dadosCompletos);
    }

    // Recalcula categoria quando genealogia/raça são alteradas para evitar categoria desatualizada.
    if (houveAlteracaoGenealogia) {
      const dadosCompletos = {
        ...bufaloAtual,
        ...dadosAtualizados,
      };

      if (dadosCompletos.idRaca && (dadosCompletos.idPai || dadosCompletos.idMae)) {
        const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoriaFromData(
          dadosCompletos.idRaca,
          dadosCompletos.idPai,
          dadosCompletos.idMae,
          1,
        );

        if (arvoreGenealogica) {
          const propriedade = dadosCompletos.idPropriedade
            ? await this.usuarioPropriedadeRepo.buscarPropriedadePorId(dadosCompletos.idPropriedade)
            : null;
          const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, propriedade?.pAbcb || false);
          dadosAtualizados = { ...dadosAtualizados, categoria };
        }
      }
    }

    // Atualiza no banco
    const bufaloAtualizado = await this.bufaloRepo.update(id, dadosAtualizados);
    await this.invalidateCache();

    this.loggerService.log(`Búfalo atualizado: ${id}`, { service: 'BufaloService', method: 'update' });
    return bufaloAtualizado;
  }

  /**
   * Remove búfalo (soft delete).
   * Define deleted_at para a data/hora atual.
   */
  async remove(id: string, user: any) {
    return this.softDelete(id, user);
  }

  /**
   * Soft delete: marca búfalo como removido sem deletar do banco.
   */
  async softDelete(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Verifica se tem descendentes
    const temDescendentes = await this.bufaloRepo.hasOffspring(id);

    if (temDescendentes) {
      throw new BadRequestException('Não é possível excluir este búfalo pois ele possui descendentes registrados.');
    }

    // Marca como deletado (soft delete)
    const bufaloRemovido = await this.bufaloRepo.softDelete(id);
    await this.invalidateCache();

    this.loggerService.log(`Búfalo removido (soft delete): ${id}`, { service: 'BufaloService', method: 'softDelete' });
    return {
      message: 'Búfalo removido com sucesso (soft delete).',
      data: bufaloRemovido,
    };
  }

  /**
   * Restaura búfalo removido logicamente.
   */
  async restore(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Valida acesso inclusive para registros removidos.
    const bufalo = await this.validateBufaloAccessIncludingDeleted(id, userId);

    if (!bufalo?.deletedAt) {
      throw new BadRequestException('Este búfalo não está removido.');
    }

    // Restaura (remove deletedAt)
    const bufaloRestaurado = await this.bufaloRepo.restore(id);
    await this.invalidateCache();

    this.loggerService.log(`Búfalo restaurado: ${id}`, { service: 'BufaloService', method: 'restore' });
    return {
      message: 'Búfalo restaurado com sucesso.',
      data: bufaloRestaurado,
    };
  }

  /**
   * Lista todos os búfalos incluindo os removidos logicamente.
   */
  async findAllWithDeleted(user: any): Promise<any[]> {
    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const bufalos = await this.bufaloRepo.findAllWithDeleted(propriedadesUsuario);

    return bufalos;
  }

  /**
   * Atualiza grupo de múltiplos búfalos.
   */
  async updateGrupo(updateGrupoDto: UpdateGrupoBufaloDto, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Valida acesso a todos os búfalos
    for (const id_bufalo of updateGrupoDto.idsBufalos) {
      await this.validateBufaloAccess(id_bufalo, userId);
    }

    // Atualiza em lote
    const bufalosAtualizados = await this.bufaloRepo.updateMany(updateGrupoDto.idsBufalos, { idGrupo: updateGrupoDto.idNovoGrupo });
    await this.invalidateCache();

    this.loggerService.log(`Grupo atualizado para ${updateGrupoDto.idsBufalos.length} búfalos`, { service: 'BufaloService', method: 'updateGrupo' });
    return {
      message: `Grupo atualizado com sucesso para ${updateGrupoDto.idsBufalos.length} búfalos.`,
      updated: bufalosAtualizados,
      total_processados: updateGrupoDto.idsBufalos.length,
    };
  }

  // ==================== MÉTODOS ADICIONAIS DE FILTRO (COMPATIBILIDADE) ====================

  /**
   * Busca búfalos por categoria ABCB.
   */
  async findByCategoria(categoria: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const bufalos = await this.bufaloRepo.findByCategoria(categoria, propriedadesUsuario);

    if (!bufalos || bufalos.length === 0) {
      this.loggerService.log(`Nenhum búfalo encontrado com categoria ${categoria}`, { service: 'BufaloService', method: 'findByCategoria' });
      return [];
    }

    this.loggerService.log(`Encontrados ${bufalos.length} búfalos com categoria ${categoria}`, {
      service: 'BufaloService',
      method: 'findByCategoria',
    });
    await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalos);
    return bufalos;
  }

  /**
   * Busca búfalos por raça e brinco.
   */
  async findByRacaAndBrinco(
    id_raca: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      { idPropriedade: id_propriedade, idRaca: id_raca, brinco, status: true },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalos por sexo e brinco.
   */
  async findBySexoAndBrinco(
    sexo: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      { idPropriedade: id_propriedade, sexo: sexo as any, brinco, status: true },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalos por sexo e status.
   */
  async findBySexoAndStatus(
    sexo: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, sexo: sexo as any, status }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por maturidade e brinco.
   */
  async findByMaturidadeAndBrinco(
    nivel_maturidade: string,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      { idPropriedade: id_propriedade, nivelMaturidade: nivel_maturidade as any, brinco, status: true },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalos por maturidade e status.
   */
  async findByMaturidadeAndStatus(
    nivel_maturidade: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado(
      { idPropriedade: id_propriedade, nivelMaturidade: nivel_maturidade as any, status },
      user,
      paginationDto,
      id_propriedade,
    );
  }

  /**
   * Busca búfalos por raça e status.
   */
  async findByRacaAndStatus(
    id_raca: string,
    status: boolean,
    id_propriedade: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, idRaca: id_raca, status }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por status.
   */
  async findByStatus(status: boolean, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, status }, user, paginationDto, id_propriedade);
  }

  /**
   * Busca búfalos por status e brinco.
   */
  async findByStatusAndBrinco(
    status: boolean,
    id_propriedade: string,
    brinco: string,
    user: any,
    paginationDto: PaginationDto = {},
  ): Promise<PaginatedResponse<any>> {
    return this.buscarComFiltrosPaginado({ idPropriedade: id_propriedade, status, brinco }, user, paginationDto, id_propriedade);
  }

  // ==================== PROCESSAMENTO DE CATEGORIA ABCB ====================

  /**
   * Processa categoria ABCB de um búfalo específico.
   */
  async processarCategoriaABCB(id_bufalo: string, shouldInvalidateCache = true) {
    // Busca dados do búfalo
    const bufalo = await this.bufaloRepo.findById(id_bufalo);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo ${id_bufalo} não encontrado.`);
    }

    // Busca informações da propriedade
    const propriedade = bufalo.idPropriedade ? await this.usuarioPropriedadeRepo.buscarPropriedadePorId(bufalo.idPropriedade) : null;

    // Constrói árvore genealógica
    const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoria(id_bufalo, 4);

    if (!arvoreGenealogica) {
      throw new BadRequestException('Não foi possível construir a árvore genealógica.');
    }

    // Calcula categoria
    const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, propriedade?.pAbcb || false);

    // Atualiza no banco
    await this.bufaloRepo.update(id_bufalo, { categoria });
    if (shouldInvalidateCache) {
      await this.invalidateCache();
    }

    return {
      id_bufalo,
      categoria_antiga: bufalo.categoria,
      categoria_nova: categoria,
      atualizado: true,
    };
  }

  /**
   * Processa categoria ABCB de todos os búfalos de uma propriedade.
   */
  async processarCategoriaPropriedade(id_propriedade: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Busca todos os búfalos ativos da propriedade
    const resultado = await this.bufaloRepo.findWithFilters({ id_propriedade, status: true }, { offset: 0, limit: 10000 });
    const bufalos = resultado.data;

    const resultados: any[] = [];
    let atualizados = 0;
    let erros = 0;

    for (const bufalo of bufalos || []) {
      try {
        const resultado = await this.processarCategoriaABCB(bufalo.idBufalo, false);
        resultados.push(resultado);

        if (resultado.categoria_antiga !== resultado.categoria_nova) {
          atualizados++;
        }
      } catch (error) {
        erros++;
        this.loggerService.logError(error, { service: 'BufaloService', method: 'processarCategoriaPropriedade', bufaloId: bufalo.idBufalo });
      }
    }

    if (atualizados > 0) {
      await this.invalidateCache();
    }

    return {
      total_processados: bufalos?.length || 0,
      atualizados,
      erros,
      resultados,
      total: bufalos?.length || 0,
      sucesso: atualizados,
    };
  }

  // ==================== INATIVAÇÃO E REATIVAÇÃO ====================

  /**
   * Inativa búfalo com data e motivo específicos.
   *
   * **Diferenças entre inativar e soft delete:**
   * - **Inativar**: Registra formalmente a baixa com data_baixa e motivo_inativo para rastreabilidade e auditoria
   * - **Soft Delete**: Apenas marca deleted_at para remoção lógica temporária
   *
   * **Validações aplicadas:**
   * - Búfalo deve existir
   * - Búfalo deve estar ativo (status = true)
   * - Usuário deve ter acesso ao búfalo através das propriedades vinculadas
   * - Data de baixa não pode ser anterior à data de nascimento
   * - Data de baixa não pode estar no futuro (validado no DTO)
   *
   * **Casos de uso:**
   * - Venda para outra propriedade
   * - Morte natural ou por doença
   * - Descarte por baixa produtividade
   * - Abate para consumo
   * - Transferência definitiva
   *
   * **Rastreabilidade:**
   * Este método garante registro permanente do motivo e data da baixa,
   * permitindo auditorias futuras e análises de causas de baixa no rebanho.
   *
   * @param id ID do búfalo (UUID)
   * @param inativarDto DTO com data_baixa e motivo_inativo
   * @param user Usuário autenticado
   * @returns Objeto com mensagem de sucesso e dados do búfalo inativado
   * @throws NotFoundException se búfalo não existir ou usuário não tiver acesso
   * @throws BadRequestException se búfalo já estiver inativo ou validação de data falhar
   * @throws InternalServerErrorException em caso de erro no banco de dados
   */
  async inativar(id: string, inativarDto: InativarBufaloDto, user: any) {
    this.loggerService.log(`Iniciando inativação do búfalo ${id}`, {
      module: 'BufaloService',
      method: 'inativar',
    });

    try {
      const userId = await this.authHelper.getUserId(user);

      // Valida acesso do usuário ao búfalo
      await this.validateBufaloAccess(id, userId);

      // Busca o búfalo
      const bufalo = await this.bufaloRepo.findById(id);

      if (!bufalo) {
        throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
      }

      if (!bufalo.status) {
        throw new BadRequestException('Este búfalo já está inativo. Use o endpoint de reativação se deseja reativá-lo.');
      }

      // Valida se a data de baixa não é anterior à data de nascimento
      if (bufalo.dtNascimento && inativarDto.dataBaixa) {
        const nascimento = new Date(bufalo.dtNascimento);
        const baixa = new Date(inativarDto.dataBaixa);

        if (baixa < nascimento) {
          throw new BadRequestException(
            `A data de baixa (${baixa.toLocaleDateString('pt-BR')}) não pode ser anterior à data de nascimento do animal (${nascimento.toLocaleDateString('pt-BR')}).`,
          );
        }
      }

      // Inativa o búfalo usando o repository Drizzle
      const bufaloInativado = await this.bufaloRepo.inativar(id, inativarDto.dataBaixa, inativarDto.motivoInativo);
      await this.invalidateCache();

      this.loggerService.log(`Búfalo inativado com sucesso: ${id}`, {
        module: 'BufaloService',
        method: 'inativar',
        bufaloNome: bufalo.nome,
        motivo: inativarDto.motivoInativo,
      });

      return {
        message: 'Búfalo inativado com sucesso.',
        data: formatDateFields(bufaloInativado),
      };
    } catch (error) {
      this.loggerService.logError(error, {
        module: 'BufaloService',
        method: 'inativar',
        bufaloId: id,
      });

      // Re-throw exceções conhecidas para o NestJS tratar com status codes corretos
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao inativar búfalo. Por favor, tente novamente.');
    }
  }

  /**
   * Reativa búfalo inativado (remove data e motivo de baixa).
   *
   * **Propósito:**
   * Permite reverter uma inativação, útil em casos de:
   * - Erro no registro de inativação
   * - Animal devolvido após venda
   * - Retorno de animal emprestado
   * - Correção de dados administrativos
   *
   * **Validações aplicadas:**
   * - Búfalo deve existir
   * - Búfalo deve estar inativo (status = false)
   * - Usuário deve ter acesso ao búfalo através das propriedades vinculadas
   *
   * **Ações executadas:**
   * - Define status como true
   * - Remove data_baixa (define como null)
   * - Remove motivo_inativo (define como null)
   * - Atualiza timestamp de updated_at
   *
   * @param id ID do búfalo (UUID)
   * @param user Usuário autenticado
   * @returns Objeto com mensagem de sucesso e dados do búfalo reativado
   * @throws NotFoundException se búfalo não existir ou usuário não tiver acesso
   * @throws BadRequestException se búfalo já estiver ativo
   * @throws InternalServerErrorException em caso de erro no banco de dados
   */
  async reativar(id: string, user: any) {
    this.loggerService.log(`Iniciando reativação do búfalo ${id}`, {
      module: 'BufaloService',
      method: 'reativar',
    });

    try {
      const userId = await this.authHelper.getUserId(user);

      // Valida acesso do usuário ao búfalo
      await this.validateBufaloAccess(id, userId);

      // Busca o búfalo
      const bufalo = await this.bufaloRepo.findById(id);

      if (!bufalo) {
        throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
      }

      if (bufalo.status) {
        throw new BadRequestException('Este búfalo já está ativo.');
      }

      // Reativa o búfalo usando o repository Drizzle
      const bufaloReativado = await this.bufaloRepo.reativar(id);
      await this.invalidateCache();

      this.loggerService.log(`Búfalo reativado com sucesso: ${id}`, {
        module: 'BufaloService',
        method: 'reativar',
        bufaloNome: bufalo.nome,
      });

      return {
        message: 'Búfalo reativado com sucesso.',
        data: formatDateFields(bufaloReativado),
      };
    } catch (error) {
      this.loggerService.logError(error, {
        module: 'BufaloService',
        method: 'reativar',
        bufaloId: id,
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao reativar búfalo. Por favor, tente novamente.');
    }
  }
}
