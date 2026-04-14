import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { CreateCicloLactacaoDto } from './dto/create-lactacao.dto';
import { UpdateCicloLactacaoDto } from './dto/update-lactacao.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { LactacaoRepositoryDrizzle } from './repositories';
import { BufaloRepositoryDrizzle } from '../../rebanho/bufalo/repositories/bufalo.repository.drizzle';
import { GrupoRepositoryDrizzle } from '../../rebanho/grupo/repositories/grupo.repository.drizzle';
import { PropriedadeRepositoryDrizzle } from '../../gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle';

@Injectable()
export class LactacaoService implements ISoftDelete {
  constructor(
    private readonly cicloRepository: LactacaoRepositoryDrizzle,
    private readonly bufaloRepository: BufaloRepositoryDrizzle,
    private readonly grupoRepository: GrupoRepositoryDrizzle,
    private readonly propriedadeRepository: PropriedadeRepositoryDrizzle,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
    private readonly alertasService: AlertasService,
  ) {}

  /**
   * Calcula dias em lactação
   */
  private calcularDiasEmLactacao(dt_parto: string, dt_secagem_real?: string | null): number {
    const dataFim = dt_secagem_real ? new Date(dt_secagem_real) : new Date();
    const dataInicio = new Date(dt_parto);
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private computeSecagemPrevista(dt_parto: string, padrao_dias: number): string {
    const baseDate = new Date(dt_parto);
    const result = new Date(baseDate);
    result.setDate(result.getDate() + padrao_dias);
    return result.toISOString().slice(0, 10);
  }

  private computeStatus(dt_secagem_real?: string | null): string {
    return dt_secagem_real ? 'Seca' : 'Em Lactação';
  }

  /**
   * Verifica se deve criar alertas para o ciclo
   */
  private async verificarAlertasCiclo(ciclo: any, bufalaData: any) {
    try {
      // Map Drizzle result to expected format if needed
      const dtParto = ciclo.dtParto || ciclo.dt_parto;
      const dtSecagemReal = ciclo.dtSecagemReal || ciclo.dt_secagem_real;
      const dtSecagemPrevista = ciclo.dtSecagemPrevista || ciclo.dt_secagem_prevista;
      const idCicloLactacao = ciclo.idCicloLactacao || ciclo.id_ciclo_lactacao;
      const idBufala = ciclo.idBufala || ciclo.id_bufala;
      const idPropriedade = ciclo.idPropriedade || ciclo.id_propriedade;

      const diasEmLactacao = this.calcularDiasEmLactacao(dtParto, dtSecagemReal);

      const cicloObj = {
        ...ciclo,
        dt_parto: dtParto,
        dt_secagem_real: dtSecagemReal,
        dt_secagem_prevista: dtSecagemPrevista,
        id_ciclo_lactacao: idCicloLactacao,
        id_bufala: idBufala,
        id_propriedade: idPropriedade,
      };

      await this.verificarCicloProlongado(cicloObj, bufalaData, diasEmLactacao);
      await this.verificarProximaSecagem(cicloObj, bufalaData);
      await this.verificarSecagemAtrasada(cicloObj, bufalaData);
      await this.verificarCicloCurto(cicloObj, bufalaData, diasEmLactacao);
    } catch (error) {
      this.logger.logError(error, {
        module: 'LactacaoService',
        method: 'verificarAlertasCiclo',
        cicloId: ciclo.idCicloLactacao || ciclo.id_ciclo_lactacao,
      });
    }
  }

  private async verificarCicloProlongado(ciclo: any, bufalaData: any, diasEmLactacao: number) {
    if (!ciclo.dt_secagem_real && diasEmLactacao > 365) {
      await this.criarAlertaProducao({
        animal_id: ciclo.id_bufala,
        bufalaData,
        id_propriedade: ciclo.id_propriedade,
        motivo: `Búfala em lactação há ${diasEmLactacao} dias - Ciclo prolongado`,
        prioridade: PrioridadeAlerta.MEDIA,
        observacao: 'Avaliar condição corporal e considerar secagem.',
        id_evento_origem: ciclo.id_ciclo_lactacao,
        tipo_evento_origem: 'CICLO_PROLONGADO',
      });
    }
  }

  private async verificarProximaSecagem(ciclo: any, bufalaData: any) {
    if (!ciclo.dt_secagem_real && ciclo.dt_secagem_prevista) {
      const dataSecagemPrev = new Date(ciclo.dt_secagem_prevista);
      const hoje = new Date();
      const diasParaSecagem = Math.ceil((dataSecagemPrev.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasParaSecagem <= 15 && diasParaSecagem >= 0) {
        await this.criarAlertaProducao({
          animal_id: ciclo.id_bufala,
          bufalaData,
          id_propriedade: ciclo.id_propriedade,
          motivo: `Secagem prevista em ${diasParaSecagem} dias (${ciclo.dt_secagem_prevista})`,
          prioridade: diasParaSecagem <= 7 ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA,
          observacao: 'Planejar protocolo de secagem e preparar animal.',
          id_evento_origem: ciclo.id_ciclo_lactacao,
          tipo_evento_origem: 'PROXIMA_SECAGEM',
        });
      }
    }
  }

  private async verificarSecagemAtrasada(ciclo: any, bufalaData: any) {
    if (!ciclo.dt_secagem_real && ciclo.dt_secagem_prevista) {
      const dataSecagemPrev = new Date(ciclo.dt_secagem_prevista);
      const hoje = new Date();
      const diasAtraso = Math.ceil((hoje.getTime() - dataSecagemPrev.getTime()) / (1000 * 60 * 60 * 24));

      if (diasAtraso > 0) {
        await this.criarAlertaProducao({
          animal_id: ciclo.id_bufala,
          bufalaData,
          id_propriedade: ciclo.id_propriedade,
          motivo: `Secagem atrasada há ${diasAtraso} dias - Data prevista: ${ciclo.dt_secagem_prevista}`,
          prioridade: diasAtraso > 30 ? PrioridadeAlerta.ALTA : PrioridadeAlerta.MEDIA,
          observacao: 'Realizar secagem urgente para preservar saúde do úbere.',
          id_evento_origem: ciclo.id_ciclo_lactacao,
          tipo_evento_origem: 'SECAGEM_ATRASADA',
        });
      }
    }
  }

  private async verificarCicloCurto(ciclo: any, bufalaData: any, diasEmLactacao: number) {
    if (ciclo.dt_secagem_real && diasEmLactacao < 200) {
      await this.criarAlertaProducao({
        animal_id: ciclo.id_bufala,
        bufalaData,
        id_propriedade: ciclo.id_propriedade,
        motivo: `Ciclo muito curto: apenas ${diasEmLactacao} dias`,
        prioridade: PrioridadeAlerta.MEDIA,
        observacao: 'Investigar causas da lactação curta (saúde, nutrição, manejo).',
        id_evento_origem: ciclo.id_ciclo_lactacao,
        tipo_evento_origem: 'CICLO_CURTO',
      });
    }
  }

  /**
   * Cria um alerta de produção
   */
  private async criarAlertaProducao(params: {
    animal_id: string;
    bufalaData: any;
    id_propriedade: string;
    motivo: string;
    prioridade: PrioridadeAlerta;
    observacao: string;
    id_evento_origem: string;
    tipo_evento_origem: string;
  }) {
    try {
      let grupoNome = 'Não informado';
      // bufalaData comes from BufaloRepositoryDrizzle, so it has camelCase keys
      const idGrupo = params.bufalaData.idGrupo || params.bufalaData.id_grupo;

      if (idGrupo) {
        const grupoData = await this.grupoRepository.findById(idGrupo);
        if (grupoData) grupoNome = grupoData.nomeGrupo;
      }

      let propriedadeNome = 'Não informada';
      if (params.id_propriedade) {
        const propData = await this.propriedadeRepository.buscarPorIdInterno(params.id_propriedade);
        if (propData) propriedadeNome = propData.nome;
      }

      await this.alertasService.createIfNotExists({
        animal_id: params.animal_id,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: params.id_propriedade,
        motivo: params.motivo,
        nicho: NichoAlerta.PRODUCAO,
        data_alerta: new Date().toISOString().split('T')[0],
        prioridade: params.prioridade,
        observacao: params.observacao,
        id_evento_origem: params.id_evento_origem,
        tipo_evento_origem: params.tipo_evento_origem,
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'LactacaoService',
        method: 'criarAlertaProducao',
      });
    }
  }

  async create(dto: CreateCicloLactacaoDto, user: any) {
    const idUsuario = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(idUsuario, dto.idPropriedade);

    this.logger.log('Iniciando criação de ciclo de lactação', {
      module: 'LactacaoService',
      method: 'create',
      bufalaId: dto.idBufala,
      dtParto: dto.dtParto,
    });

    const dt_secagem_prevista = this.computeSecagemPrevista(dto.dtParto, dto.padraoDias);
    const status = this.computeStatus(dto.dtSecagemReal);

    this.logger.log('Calculando datas e status do ciclo', {
      module: 'LactacaoService',
      method: 'create',
      dtSecagemPrevista: dt_secagem_prevista,
      status,
    });

    try {
      const data = await this.cicloRepository.criar({
        ...dto,
        dt_secagem_prevista,
        status,
      });

      // Buscar dados da búfala para verificar alertas
      const bufalaData = await this.bufaloRepository.findById(dto.idBufala);

      if (bufalaData) {
        await this.verificarAlertasCiclo(data, bufalaData);
      }

      this.logger.log('Ciclo de lactação criado com sucesso', {
        module: 'CicloLactacaoService',
        method: 'create',
        cicloId: data.idCicloLactacao,
        bufalaId: dto.idBufala,
      });
      return formatDateFields(data);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'create',
        bufalaId: dto.idBufala,
      });
      throw new InternalServerErrorException(`Falha ao criar ciclo de lactação: ${error.message}`);
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os ciclos de lactação com paginação', {
      module: 'CicloLactacaoService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue } = calculatePaginationParams(page, limit);

    try {
      const { registros, total } = await this.cicloRepository.listarTodos(page, limitValue);

      this.logger.log(`Busca de ciclos de lactação concluída - ${registros.length} ciclos encontrados (página ${page})`, {
        module: 'CicloLactacaoService',
        method: 'findAll',
      });

      const formattedData = formatDateFieldsArray(registros);
      return createPaginatedResponse(formattedData, total, page, limitValue);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar ciclos de lactação: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}, user: any): Promise<PaginatedResponse<any>> {
    const idUsuario = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(idUsuario, id_propriedade);

    this.logger.log('Iniciando busca de ciclos por propriedade', {
      module: 'CicloLactacaoService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue } = calculatePaginationParams(page, limit);

    try {
      const { registros, total } = await this.cicloRepository.listarPorPropriedade(id_propriedade, page, limitValue);

      // Otimização: buscar todos os ciclos ativos em uma única query (evita N+1)
      const bufalaIds = registros.map((ciclo: any) => ciclo.idBufala).filter(Boolean);
      const ciclosAtivosMap = new Map<string, string>();

      if (bufalaIds.length > 0) {
        const uniqueBufalaIds = [...new Set(bufalaIds)];
        const ciclosAtivos = await this.cicloRepository.buscarCiclosAtivosPorBufalas(uniqueBufalaIds);

        // Mapear idBufala -> idCicloLactacao do ciclo ativo
        for (const [idBufala, ciclo] of ciclosAtivos.entries()) {
          ciclosAtivosMap.set(idBufala, ciclo.idCicloLactacao);
        }
      }

      // Transformar a resposta para enriquecer os dados
      const enrichedData = registros.map((ciclo: any) => {
        const diasEmLactacao = this.calcularDiasEmLactacao(ciclo.dtParto, ciclo.dtSecagemReal);
        const isCicloAtual = ciclosAtivosMap.get(ciclo.idBufala) === ciclo.idCicloLactacao;

        return {
          idCicloLactacao: ciclo.idCicloLactacao,
          idBufala: ciclo.idBufala,
          idPropriedade: ciclo.idPropriedade,
          dtParto: ciclo.dtParto,
          padraoDias: ciclo.padraoDias,
          dtSecagemPrevista: ciclo.dtSecagemPrevista,
          dtSecagemReal: ciclo.dtSecagemReal,
          status: ciclo.status,
          observacao: ciclo.observacao,
          createdAt: ciclo.createdAt,
          updatedAt: ciclo.updatedAt,
          deletedAt: ciclo.deletedAt,
          diasEmLactacao,
          cicloAtual: isCicloAtual ? 1 : 0,
          bufala: {
            nome: ciclo.bufalo?.nome || null,
            brinco: ciclo.bufalo?.brinco || null,
            raca: ciclo.bufalo?.raca?.nome || null,
          },
        };
      });

      this.logger.log(`Busca concluída - ${registros.length} ciclos encontrados (página ${page})`, {
        module: 'CicloLactacaoService',
        method: 'findByPropriedade',
      });

      const formattedData = formatDateFieldsArray(enrichedData);
      return createPaginatedResponse(formattedData, total, page, limitValue);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar ciclos da propriedade: ${error.message}`);
    }
  }

  async findOne(id_ciclo_lactacao: string, user: any) {
    this.logger.log('Iniciando busca de ciclo de lactação por ID', {
      module: 'CicloLactacaoService',
      method: 'findOne',
      cicloId: id_ciclo_lactacao,
    });

    const data = await this.cicloRepository.buscarPorId(id_ciclo_lactacao);

    if (!data) {
      this.logger.warn('Ciclo de lactação não encontrado', {
        module: 'CicloLactacaoService',
        method: 'findOne',
        cicloId: id_ciclo_lactacao,
      });
      throw new NotFoundException(`Ciclo de lactação com ID ${id_ciclo_lactacao} não encontrado.`);
    }

    const idUsuario = await this.authHelper.getUserId(user);
    if (data.idPropriedade) {
      await this.authHelper.validatePropriedadeAccess(idUsuario, data.idPropriedade);
    }

    this.logger.log('Ciclo de lactação encontrado com sucesso', {
      module: 'CicloLactacaoService',
      method: 'findOne',
      cicloId: id_ciclo_lactacao,
    });
    return formatDateFields(data);
  }

  async update(id_ciclo_lactacao: string, dto: UpdateCicloLactacaoDto, user: any) {
    this.logger.log('Iniciando atualização de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
    });

    const current = await this.findOne(id_ciclo_lactacao, user);

    const dt_parto = dto.dtParto ?? current.dtParto;
    const padrao_dias = dto.padraoDias ?? current.padraoDias;
    const dt_secagem_prevista = this.computeSecagemPrevista(dt_parto, padrao_dias);
    const status = this.computeStatus(dto.dtSecagemReal ?? current.dtSecagemReal);

    this.logger.log('Recalculando datas e status do ciclo', {
      module: 'CicloLactacaoService',
      method: 'update',
      cicloId: id_ciclo_lactacao,
      dtSecagemPrevista: dt_secagem_prevista,
      status,
    });

    try {
      const data = await this.cicloRepository.atualizar(id_ciclo_lactacao, {
        ...dto,
        dt_secagem_prevista,
        status,
      });

      // Verificar alertas após atualização
      if (data.idBufala) {
        const bufalaData = await this.bufaloRepository.findById(data.idBufala);

        if (bufalaData) {
          await this.verificarAlertasCiclo(data, bufalaData);
        }
      }

      this.logger.log('Ciclo de lactação atualizado com sucesso', {
        module: 'CicloLactacaoService',
        method: 'update',
        cicloId: id_ciclo_lactacao,
      });
      return formatDateFields(data);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'update',
        cicloId: id_ciclo_lactacao,
      });
      throw new InternalServerErrorException(`Falha ao atualizar ciclo de lactação: ${error.message}`);
    }
  }

  async remove(id_ciclo_lactacao: string, user: any) {
    return this.softDelete(id_ciclo_lactacao, user);
  }

  async softDelete(id: string, user?: any) {
    this.logger.log('Iniciando remoção de ciclo de lactação (soft delete)', {
      module: 'CicloLactacaoService',
      method: 'softDelete',
      cicloId: id,
    });

    await this.findOne(id, user);

    try {
      const data = await this.cicloRepository.softDelete(id);

      this.logger.log('Ciclo de lactação removido com sucesso (soft delete)', {
        module: 'CicloLactacaoService',
        method: 'softDelete',
        cicloId: id,
      });

      return {
        message: 'Ciclo de lactação removido com sucesso (soft delete)',
        data: formatDateFields(data),
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'softDelete',
        cicloId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover ciclo de lactação: ${error.message}`);
    }
  }

  async restore(id: string, user?: any) {
    this.logger.log('Iniciando restauração de ciclo de lactação', {
      module: 'CicloLactacaoService',
      method: 'restore',
      cicloId: id,
    });

    try {
      const idUsuario = await this.authHelper.getUserId(user);
      const cicloExistente = await this.cicloRepository.buscarPorIdComDeletados(id);

      if (!cicloExistente) {
        throw new NotFoundException(`Ciclo de lactação com ID ${id} não encontrado.`);
      }

      if (cicloExistente.idPropriedade) {
        await this.authHelper.validatePropriedadeAccess(idUsuario, cicloExistente.idPropriedade);
      }

      if (!cicloExistente.deletedAt) {
        throw new BadRequestException('Este ciclo não está removido');
      }

      const data = await this.cicloRepository.restaurar(id);

      if (!data) {
        throw new NotFoundException(`Ciclo de lactação com ID ${id} não encontrado ou não estava deletado.`);
      }

      this.logger.log('Ciclo de lactação restaurado com sucesso', {
        module: 'CicloLactacaoService',
        method: 'restore',
        cicloId: id,
      });

      return {
        message: 'Ciclo de lactação restaurado com sucesso',
        data: formatDateFields(data),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'restore',
        cicloId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar ciclo de lactação: ${error.message}`);
    }
  }

  async findAllWithDeleted(user?: any): Promise<any[]> {
    this.logger.log('Buscando todos os ciclos de lactação incluindo deletados', {
      module: 'CicloLactacaoService',
      method: 'findAllWithDeleted',
    });

    try {
      const idUsuario = await this.authHelper.getUserId(user);
      const propriedadesUsuario = await this.authHelper.getUserPropriedades(idUsuario);
      const data = await this.cicloRepository.listarComDeletadosPorPropriedades(propriedadesUsuario);
      return formatDateFieldsArray(data || []);
    } catch (error) {
      this.logger.logError(error, {
        module: 'CicloLactacaoService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar ciclos de lactação (incluindo deletados)');
    }
  }

  /**
   * Retorna estatísticas gerais de ciclos de lactação por propriedade
   */
  async getEstatisticasPropriedade(id_propriedade: string, user: any) {
    const idUsuario = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(idUsuario, id_propriedade);

    this.logger.log('Buscando estatísticas de ciclos por propriedade', {
      module: 'CicloLactacaoService',
      method: 'getEstatisticasPropriedade',
      propriedadeId: id_propriedade,
    });

    try {
      const data = await this.cicloRepository.getEstatisticasPropriedade(id_propriedade);

      const totalCiclos = data.length;
      const ciclosAtivos = data.filter((c) => c.status === 'Em Lactação').length;
      const ciclosSecos = data.filter((c) => c.status === 'Seca').length;

      // Calcular média de dias em lactação dos ciclos ativos
      const ciclosAtivosComDias = data.filter((c) => c.status === 'Em Lactação').map((c) => this.calcularDiasEmLactacao(c.dtParto));

      const mediaDiasLactacao =
        ciclosAtivosComDias.length > 0 ? Math.round(ciclosAtivosComDias.reduce((a, b) => a + b, 0) / ciclosAtivosComDias.length) : 0;

      // Ciclos próximos da secagem (próximos 30 dias)
      const hoje = new Date();
      const ciclosProximosSecagem = data.filter((c) => {
        if (c.status !== 'Em Lactação' || !c.dtSecagemPrevista) return false;
        const dataSecagem = new Date(c.dtSecagemPrevista);
        const diasParaSecagem = Math.ceil((dataSecagem.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diasParaSecagem >= 0 && diasParaSecagem <= 30;
      }).length;

      // Ciclos com secagem atrasada
      const ciclosSecagemAtrasada = data.filter((c) => {
        if (c.status !== 'Em Lactação' || !c.dtSecagemPrevista) return false;
        const dataSecagem = new Date(c.dtSecagemPrevista);
        return hoje > dataSecagem;
      }).length;

      return {
        total_ciclos: totalCiclos,
        ciclos_ativos: ciclosAtivos,
        ciclos_secos: ciclosSecos,
        media_dias_lactacao: mediaDiasLactacao,
        ciclos_proximos_secagem: ciclosProximosSecagem,
        ciclos_secagem_atrasada: ciclosSecagemAtrasada,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Falha ao buscar estatísticas: ${error.message}`);
    }
  }
}
