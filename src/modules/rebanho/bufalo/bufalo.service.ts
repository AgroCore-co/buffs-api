import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { CreateBufaloDto } from './dto/create-bufalo.dto';
import { UpdateBufaloDto } from './dto/update-bufalo.dto';
import { UpdateGrupoBufaloDto } from './dto/update-grupo-bufalo.dto';
import { FiltroBufaloDto } from './dto/filtro-bufalo.dto';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';

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
   * Com CACHE de 5 minutos.
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

    // 4. Salva no cache por 5 minutos (300000 ms)
    await this.cacheService.set(cacheKey, propriedadesUnicas, 300000);

    return propriedadesUnicas;
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
   * Cria novo búfalo com cálculo automático de maturidade e categoria ABCB.
   */
  async create(createDto: CreateBufaloDto, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso à propriedade
    await this.validatePropriedadeAccess(createDto.id_propriedade, userId);

    try {
      // 1. Processa maturidade automaticamente
      const dadosComMaturidade = this.maturidadeService.processarDadosMaturidade(createDto);

      // 2. Calcula categoria ABCB se tiver genealogia
      let dadosFinais = { ...dadosComMaturidade };

      if (createDto.id_pai || createDto.id_mae) {
        // Cria búfalo temporário para construir árvore
        const bufaloTemp = {
          id_bufalo: 'temp',
          id_pai: createDto.id_pai,
          id_mae: createDto.id_mae,
          id_raca: createDto.id_raca,
        };

        const arvoreGenealogica = await this.genealogiaService.construirArvoreParaCategoria(bufaloTemp.id_bufalo, 4);

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

    // Delega para service de filtros (propriedades é array, repo aceita)
    const resultado = await this.filtrosService.filtrarBufalos(
      {
        id_propriedade: propriedadesUsuario.length === 1 ? propriedadesUsuario[0] : undefined,
        status: true,
      },
      { offset, limit },
    );

    // Se tem múltiplas propriedades, filtra manualmente
    let dadosFiltrados = resultado.data;
    let totalFiltrado = resultado.total;

    if (propriedadesUsuario.length > 1) {
      // Busca de todas as propriedades
      const todasPromises = propriedadesUsuario.map((id_prop) =>
        this.filtrosService.filtrarBufalos({ id_propriedade: id_prop, status: true }, { offset: 0, limit: 10000 }),
      );
      const todosResultados = await Promise.all(todasPromises);
      const todosBufalos = todosResultados.flatMap((r) => r.data);

      // Pagina manualmente
      dadosFiltrados = todosBufalos.slice(offset, offset + limit);
      totalFiltrado = todosBufalos.length;
    }

    // Filtra búfalos não deletados
    const bufalosAtivos = dadosFiltrados.filter((b) => !b.deletedAt);

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario(bufalosAtivos);

    return createPaginatedResponse(bufalosAtivos, bufalosAtivos.length, page, limit);
  }

  /**
   * Busca búfalo por ID.
   */
  async findOne(id: string, user: any) {
    const userId = await this.getUserId(user);

    // Valida acesso
    await this.validateBufaloAccess(id, userId);

    // Busca dados
    const bufalo = await this.filtrosService.buscarPorId(id);

    if (!bufalo) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Atualiza maturidade automaticamente
    await this.maturidadeService.atualizarMaturidadeSeNecessario([bufalo]);

    return bufalo;
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

    // Delega para service de filtros
    const resultado = await this.filtrosService.buscarPorPropriedade(id_propriedade, { offset, limit });

    // Atualiza maturidade
    await this.maturidadeService.atualizarMaturidadeSeNecessario(resultado.data);

    // Drizzle already returns properly typed data
    return createPaginatedResponse(resultado.data, resultado.total, page, limit);
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
}
