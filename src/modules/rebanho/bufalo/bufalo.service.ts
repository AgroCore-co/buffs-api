import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { FiltroBufaloDto } from './dto/filtro-bufalo.dto';
import { InativarBufaloDto } from './dto/inativar-bufalo.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { formatDateFields } from '../../../core/utils/date-formatter.utils';

import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from './repositories/usuario-propriedade.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';

@Injectable()
export class BufaloService implements ISoftDelete {
  private readonly logger = new Logger(BufaloService.name);

  constructor(
    private readonly genealogiaService: GenealogiaService,
    private readonly bufaloRepo: BufaloRepositoryDrizzle,
    private readonly usuarioPropriedadeRepo: UsuarioPropriedadeRepositoryDrizzle,
    private readonly maturidadeService: BufaloMaturidadeService,
    private readonly categoriaService: BufaloCategoriaService,
    private readonly filtrosService: BufaloFiltrosService,
    private readonly cacheService: CacheService,
    private readonly loggerService: LoggerService,
  ) {}

  // ==================== AUTENTICAÇÃO E AUTORIZAÇÃO ====================

  /**
   * Obtém ID do usuário a partir do email.
   */
  private async getUserId(user: any): Promise<string> {
    const perfilUsuario = await this.usuarioPropriedadeRepo.buscarUsuarioPorEmail(user.email);

    if (!perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.idUsuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário (como dono OU funcionário).
   * Cache reduzido para 30 segundos (equilíbrio entre performance e segurança).
   */
  private async getUserPropriedades(userId: string): Promise<string[]> {
    const cacheKey = `user_props:${userId}`;

    // 1. Tenta pegar do cache
    const cachedProps = await this.cacheService.get<string[]>(cacheKey);
    if (cachedProps) {
      return cachedProps;
    }

    // 2. Se não tiver no cache, busca no banco
    const propriedadesComoDono = await this.usuarioPropriedadeRepo.buscarPropriedadesComoDono(userId);
    const propriedadesComoFuncionario = await this.usuarioPropriedadeRepo.buscarPropriedadesComoFuncionario(userId);

    // 3. Combina ambas as listas
    const todasPropriedades = [...propriedadesComoDono.map((p) => p.idPropriedade), ...propriedadesComoFuncionario.map((p) => p.idPropriedade)];

    // Remove duplicatas
    const propriedadesUnicas = Array.from(new Set(todasPropriedades.filter((id): id is string => id !== null)));

    if (propriedadesUnicas.length === 0) {
      throw new NotFoundException('Usuário não está associado a nenhuma propriedade.');
    }

    // 4. Cache reduzido para 30 segundos
    await this.cacheService.set(cacheKey, propriedadesUnicas, 30000);

    return propriedadesUnicas;
  }

  /**
   * Invalida cache de propriedades do usuário.
   * Deve ser chamado quando usuário é vinculado/desvinculado de propriedades.
   */
  async invalidarCachePropriedades(userId: string): Promise<void> {
    const cacheKey = `user_props:${userId}`;
    await this.cacheService.del(cacheKey);
    this.logger.log(`Cache de propriedades invalidado: ${userId}`);
  }

  /**
   * Valida se o usuário tem acesso ao búfalo através das propriedades vinculadas.
   */
  private async validateBufaloAccess(bufaloId: string, userId: string): Promise<void> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const bufalo = await this.bufaloRepo.findById(bufaloId);

    if (!bufalo || !bufalo.idPropriedade || !propriedadesUsuario.includes(bufalo.idPropriedade)) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado nas propriedades vinculadas ao usuário.`);
    }
  }

  /**
   * Valida se o usuário tem acesso a uma propriedade específica.
   */
  private async validatePropriedadeAccess(id_propriedade: string, userId: string): Promise<void> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    if (!propriedadesUsuario.includes(id_propriedade)) {
      throw new NotFoundException(`Propriedade com ID ${id_propriedade} não encontrada ou você não tem acesso a ela.`);
    }
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
   * Enriquece um array de búfalos com campos derivados.
   * Aplica enrichBufaloWithDerivedFields() para cada item.
   *
   * @param bufalos Array de búfalos
   * @returns Array de búfalos enriquecidos
   */
  private enrichBufalosWithDerivedFields(bufalos: any[]): any[] {
    if (!bufalos || bufalos.length === 0) return [];
    return bufalos.map((bufalo) => this.enrichBufaloWithDerivedFields(bufalo));
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
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const grupo = await this.usuarioPropriedadeRepo.buscarGrupoPorId(id_grupo, propriedadesUsuario);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id_grupo} não encontrado ou você não tem acesso a ele.`);
    }
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
   */
  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(createDto.id_propriedade, userId);

    // Valida genealogia (previne circularidade)
    await this.validarGenealogiaCircular(undefined, createDto.id_pai, createDto.id_mae);

    try {
      // 1. Processa maturidade automaticamente
      const dadosComMaturidade = this.maturidadeService.processarDadosMaturidade(createDto);

      // 2. Calcula categoria ABCB se tiver genealogia
      let dadosFinais = { ...dadosComMaturidade };

      if (createDto.id_pai || createDto.id_mae) {
        // Constrói árvore genealógica a partir dos dados fornecidos (sem buscar búfalo inexistente)
        const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoriaFromData(
          createDto.id_raca ?? null,
          createDto.id_pai,
          createDto.id_mae,
          1,
        );

        if (arvoreGenealogica) {
          // Verifica se propriedade participa ABCB
          const propriedade = await this.usuarioPropriedadeRepo.buscarPropriedadePorId(createDto.id_propriedade);

          const categoria = this.categoriaService.processarCategoriaABCB(arvoreGenealogica, propriedade?.pAbcb || false);
          dadosFinais = { ...dadosFinais, categoria };
        }
      }

      // 3. Cria no banco
      const novoBufalo = await this.bufaloRepo.create(dadosFinais);

      this.logger.log(`✅ Búfalo criado: ${novoBufalo.nome || novoBufalo.brinco}`);
      return novoBufalo;
    } catch (error) {
      this.loggerService.logError(error, { service: 'BufaloService', method: 'create' });
      throw error;
    }
  }

  /**
   * Lista todos os búfalos das propriedades do usuário com paginação.
   * Exclui búfalos removidos logicamente (deleted_at não nulo).
   */
  async findAll(user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    // Busca diretamente do repository Drizzle com joins genealógicos
    const resultado = await this.bufaloRepo.findWithFilters(
      {
        id_propriedade: propriedadesUsuario,
        status: true,
      },
      { offset, limit },
    );

    const totalResponse = await this.bufaloRepo.countWithFilters({
      id_propriedade: propriedadesUsuario,
      status: true,
    });

    const bufalos = resultado.data || [];
    const total = totalResponse.count || 0;

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalos);

    // Enriquece com campos derivados usando método otimizado (previne N+1)
    const bufalosEnriquecidos = await this.enrichBufalosWithDerivedFieldsBatch(bufalos);

    return createPaginatedResponse(bufalosEnriquecidos, total, page, limit);
  }

  /**
   * Busca búfalo por ID.
   */
  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Busca diretamente do repository Drizzle com joins genealógicos
    const resultado = await this.bufaloRepo.findWithFilters(
      {
        id_propriedade,
        status: true,
      },
      { offset, limit },
    );

    const totalResponse = await this.bufaloRepo.countWithFilters({
      id_propriedade,
      status: true,
    });

    const bufalos = resultado.data || [];
    const total = totalResponse.count || 0;

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalos);

    // Enriquece com campos derivados usando método otimizado (previne N+1)
    const bufalosEnriquecidos = await this.enrichBufalosWithDerivedFieldsBatch(bufalos);

    return createPaginatedResponse(bufalosEnriquecidos, total, page, limit);
  }

  /**
   * Busca búfalos por raça em uma propriedade.
   */
  async findByRaca(id_raca: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeERaca(id_propriedade, id_raca, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por sexo em uma propriedade.
   */
  async findBySexo(sexo: string, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeESexo(id_propriedade, sexo as any, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedadeEMaturidade(id_propriedade, nivel_maturidade as any, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por grupo de manejo.
   * Retorna todos os búfalos ativos associados ao grupo específico.
   */
  async findByGrupo(id_grupo: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);

    // Valida se o grupo existe e se o usuário tem acesso
    await this.validateGrupoAccess(id_grupo, userId);

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorGrupo(id_grupo, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Filtra com os parâmetros fornecidos
    const resultado = await this.filtrosService.filtrarBufalos(
      {
        id_propriedade,
        id_raca: filtroDto.id_raca,
        sexo: filtroDto.sexo,
        nivel_maturidade: filtroDto.nivel_maturidade,
        status: filtroDto.status !== undefined ? filtroDto.status : true,
        brinco: filtroDto.brinco,
      },
      { offset, limit },
    );

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
  }

  /**
   * Busca búfalo por microchip.
   */
  async findByMicrochip(microchip: string, user: any) {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

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
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Valida genealogia se houver mudança de pai/mãe
    if (updateDto.id_pai !== undefined || updateDto.id_mae !== undefined) {
      const bufaloAtual = await this.bufaloRepo.findById(id);
      await this.validarGenealogiaCircular(
        id,
        updateDto.id_pai !== undefined ? updateDto.id_pai : bufaloAtual?.idPai,
        updateDto.id_mae !== undefined ? updateDto.id_mae : bufaloAtual?.idMae,
      );
    }

    // Se mudou data de nascimento ou sexo, recalcula maturidade
    let dadosAtualizados = { ...updateDto };

    if (updateDto.dt_nascimento || updateDto.sexo) {
      // Busca dados atuais
      const bufaloAtual = await this.filtrosService.buscarPorId(id);

      const dadosCompletos = {
        ...bufaloAtual,
        ...updateDto,
      };

      dadosAtualizados = this.maturidadeService.processarDadosMaturidade(dadosCompletos);
    }

    // Atualiza no banco
    const bufaloAtualizado = await this.bufaloRepo.update(id, dadosAtualizados);

    this.logger.log(`✅ Búfalo atualizado: ${id}`);
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
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Verifica se tem descendentes
    const temDescendentes = await this.bufaloRepo.hasOffspring(id);

    if (temDescendentes) {
      throw new BadRequestException('Não é possível excluir este búfalo pois ele possui descendentes registrados.');
    }

    // Marca como deletado (soft delete)
    const bufaloRemovido = await this.bufaloRepo.softDelete(id);

    this.logger.log(`Búfalo removido (soft delete): ${id}`);
    return {
      message: 'Búfalo removido com sucesso (soft delete).',
      data: bufaloRemovido,
    };
  }

  /**
   * Restaura búfalo removido logicamente.
   */
  async restore(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Verifica se está deletado
    const bufalo = await this.bufaloRepo.findById(id);

    if (!bufalo || !bufalo.deletedAt) {
      throw new BadRequestException('Este búfalo não está removido.');
    }

    // Restaura (remove deletedAt)
    const bufaloRestaurado = await this.bufaloRepo.restore(id);

    this.logger.log(`Búfalo restaurado: ${id}`);
    return {
      message: 'Búfalo restaurado com sucesso.',
      data: bufaloRestaurado,
    };
  }

  /**
   * Lista todos os búfalos incluindo os removidos logicamente.
   */
  async findAllWithDeleted(user: any): Promise<any[]> {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const bufalos = await this.bufaloRepo.findAllWithDeleted(propriedadesUsuario);

    return bufalos;
  }

  /**
   * Atualiza grupo de múltiplos búfalos.
   */
  async updateGrupo(updateGrupoDto: UpdateGrupoBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso a todos os búfalos
    for (const id_bufalo of updateGrupoDto.ids_bufalos) {
      await this.validateBufaloAccess(id_bufalo, userId);
    }

    // Atualiza em lote
    const bufalosAtualizados = await this.bufaloRepo.updateMany(updateGrupoDto.ids_bufalos, { idGrupo: updateGrupoDto.id_novo_grupo });

    this.logger.log(`✅ Grupo atualizado para ${updateGrupoDto.ids_bufalos.length} búfalos`);
    return {
      message: `Grupo atualizado com sucesso para ${updateGrupoDto.ids_bufalos.length} búfalos.`,
      updated: bufalosAtualizados,
      total_processados: updateGrupoDto.ids_bufalos.length,
    };
  }

  // ==================== MÉTODOS ADICIONAIS DE FILTRO (COMPATIBILIDADE) ====================

  /**
   * Busca búfalos por categoria ABCB.
   */
  async findByCategoria(categoria: string, user: any) {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const bufalos = await this.bufaloRepo.findByCategoria(categoria, propriedadesUsuario);

    if (!bufalos || bufalos.length === 0) {
      this.logger.log(`Nenhum búfalo encontrado com categoria ${categoria}`);
      return [];
    }

    this.logger.log(`✅ Encontrados ${bufalos.length} búfalos com categoria ${categoria}`);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, id_raca, brinco, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, sexo: sexo as any, brinco, status: true }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, sexo: sexo as any, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos(
      { id_propriedade, nivel_maturidade: nivel_maturidade as any, brinco, status: true },
      { offset, limit },
    );

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos(
      { id_propriedade, nivel_maturidade: nivel_maturidade as any, status },
      { offset, limit },
    );

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, id_raca, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
  }

  /**
   * Busca búfalos por status.
   */
  async findByStatus(status: boolean, id_propriedade: string, user: any, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, status }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    const resultado = await this.filtrosService.filtrarBufalos({ id_propriedade, status, brinco }, { offset, limit });

    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
  }

  // ==================== PROCESSAMENTO DE CATEGORIA ABCB ====================

  /**
   * Processa categoria ABCB de um búfalo específico.
   */
  async processarCategoriaABCB(id_bufalo: string) {
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
    const userId = await this.getUserId(user);
    await this.validatePropriedadeAccess(id_propriedade, userId);

    // Busca todos os búfalos ativos da propriedade
    const resultado = await this.bufaloRepo.findWithFilters({ id_propriedade, status: true }, { offset: 0, limit: 10000 });
    const bufalos = resultado.data;

    const resultados: any[] = [];
    let atualizados = 0;
    let erros = 0;

    for (const bufalo of bufalos || []) {
      try {
        const resultado = await this.processarCategoriaABCB(bufalo.idBufalo);
        resultados.push(resultado);

        if (resultado.categoria_antiga !== resultado.categoria_nova) {
          atualizados++;
        }
      } catch (error) {
        erros++;
        this.logger.error(`Erro ao processar categoria do búfalo ${bufalo.id_bufalo}:`, error);
      }
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
      const userId = await this.getUserId(user);

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
      if (bufalo.dtNascimento && inativarDto.data_baixa) {
        const nascimento = new Date(bufalo.dtNascimento);
        const baixa = new Date(inativarDto.data_baixa);

        if (baixa < nascimento) {
          throw new BadRequestException(
            `A data de baixa (${baixa.toLocaleDateString('pt-BR')}) não pode ser anterior à data de nascimento do animal (${nascimento.toLocaleDateString('pt-BR')}).`,
          );
        }
      }

      // Inativa o búfalo usando o repository Drizzle
      const bufaloInativado = await this.bufaloRepo.inativar(id, inativarDto.data_baixa, inativarDto.motivo_inativo);

      this.loggerService.log(`Búfalo inativado com sucesso: ${id}`, {
        module: 'BufaloService',
        method: 'inativar',
        bufaloNome: bufalo.nome,
        motivo: inativarDto.motivo_inativo,
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
      const userId = await this.getUserId(user);

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
