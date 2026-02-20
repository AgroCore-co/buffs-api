import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateDadosLactacaoDto } from './dto/create-ordenha.dto';
import { UpdateDadosLactacaoDto } from './dto/update-dados-lactacao.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { CreateAlertaDto, NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { GeminiService } from '../../../core/gemini/gemini.service';
import { FemeaEmLactacaoDto } from './dto/femea-em-lactacao.dto';
import { ResumoProducaoBufalaDto } from './dto/resumo-producao-bufala.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { OrdenhaRepository } from './repositories';
import { BufaloRepositoryDrizzle } from '../../rebanho/bufalo/repositories/bufalo.repository.drizzle';
import { LactacaoRepositoryDrizzle } from '../lactacao/repositories';
import { PropriedadeRepositoryDrizzle } from '../../gestao-propriedade/propriedade/repositories/propriedade.repository.drizzle';

@Injectable()
export class OrdenhaService implements ISoftDelete {
  private readonly logger = new Logger(OrdenhaService.name);

  constructor(
    private readonly controleRepository: OrdenhaRepository,
    private readonly authHelper: AuthHelperService,
    private readonly bufaloRepository: BufaloRepositoryDrizzle,
    private readonly cicloRepository: LactacaoRepositoryDrizzle,
    private readonly propriedadeRepository: PropriedadeRepositoryDrizzle,
    private readonly alertasService: AlertasService,
    private readonly geminiService: GeminiService,
    private readonly customLogger: LoggerService,
  ) {}

  /**
   * Cria um registro de lactação, associando-o ao usuário autenticado.
   * Se houver uma ocorrência clínica, cria um alerta associado.
   */
  async create(createDto: CreateDadosLactacaoDto, user: any) {
    this.customLogger.log('Iniciando criação de registro de lactação', {
      module: 'OrdenhaService',
      method: 'create',
      bufalaId: createDto.idBufala,
      dtOrdenha: createDto.dtOrdenha,
    });

    const idUsuario = await this.authHelper.getUserId(user);
    this.customLogger.log('ID do usuário obtido com sucesso', {
      module: 'OrdenhaService',
      method: 'create',
      userId: idUsuario,
    });

    try {
      // Check if bufala exists
      const bufala = await this.bufaloRepository.findById(createDto.idBufala);
      if (!bufala) {
        this.customLogger.warn('Búfala não encontrada', {
          module: 'OrdenhaService',
          method: 'create',
          bufalaId: createDto.idBufala,
        });
        throw new BadRequestException(`A búfala com id ${createDto.idBufala} não foi encontrada.`);
      }

      const lactacaoData = await this.controleRepository.criar(createDto, idUsuario);

      this.customLogger.log('Registro de lactação criado com sucesso', {
        module: 'OrdenhaService',
        method: 'create',
        lactacaoId: lactacaoData.idLact,
      });

      // Se houver ocorrência, criar alerta
      if (createDto.ocorrencia) {
        await this.criarAlertaOcorrencia(createDto, lactacaoData.idLact, user);
      }

      return formatDateFields(lactacaoData);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'create',
        bufalaId: createDto.idBufala,
      });
      throw new InternalServerErrorException('Falha ao criar o dado de lactação.');
    }
  }

  private async criarAlertaOcorrencia(dto: CreateDadosLactacaoDto, idLactacao: string, user: any) {
    try {
      // Buscar dados da búfala para o alerta
      const bufala = await this.bufaloRepository.findById(dto.idBufala);
      const nomeBufala = bufala?.nome || 'Desconhecida';
      const grupoNome = bufala?.grupo?.nomeGrupo || 'Não informado';
      const propriedadeNome = bufala?.propriedade?.nome || 'Não informada';

      // Determinar prioridade baseada no tipo de ocorrência
      const ocorrenciaLower = dto.ocorrencia?.toLowerCase() || '';
      let prioridade = PrioridadeAlerta.MEDIA;

      if (ocorrenciaLower.includes('mastite') || ocorrenciaLower.includes('sangue') || ocorrenciaLower.includes('infecção')) {
        prioridade = PrioridadeAlerta.ALTA;
      } else if (ocorrenciaLower.includes('leve') || ocorrenciaLower.includes('normal')) {
        prioridade = PrioridadeAlerta.BAIXA;
      }

      const alertaDto: CreateAlertaDto = {
        animal_id: dto.idBufala,
        grupo: grupoNome,
        localizacao: propriedadeNome,
        id_propriedade: dto.idPropriedade,
        motivo: `Ocorrência na ordenha: ${dto.ocorrencia}`,
        nicho: NichoAlerta.MANEJO,
        data_alerta: new Date().toISOString().split('T')[0],
        prioridade: prioridade,
        observacao: `Período: ${dto.periodo}. Verificar búfala ${nomeBufala}.`,
        id_evento_origem: idLactacao,
        tipo_evento_origem: 'CONTROLE_LEITEIRO',
      };

      await this.alertasService.createIfNotExists(alertaDto);
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'criarAlertaOcorrencia',
      });
      // Não lançar erro para não impedir a criação do registro de lactação
    }
  }

  async findAll(page = 1, limit = 10) {
    this.customLogger.log('Iniciando busca de todos os registros de lactação', {
      module: 'OrdenhaService',
      method: 'findAll',
      page,
      limit,
    });

    try {
      const { registros, total } = await this.controleRepository.listarTodos(page, limit);

      this.customLogger.log(`Busca concluída - ${registros.length} registros encontrados`, {
        module: 'OrdenhaService',
        method: 'findAll',
        page,
        limit,
      });

      return {
        data: formatDateFieldsArray(registros),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException('Falha ao buscar os dados de lactação.');
    }
  }

  async findAllByPropriedade(id_propriedade: string, page = 1, limit = 10) {
    this.customLogger.log('Iniciando busca de registros de lactação por propriedade', {
      module: 'OrdenhaService',
      method: 'findAllByPropriedade',
      propriedadeId: id_propriedade,
      page,
      limit,
    });

    try {
      const { registros, total } = await this.controleRepository.listarPorPropriedade(id_propriedade, page, limit);

      this.customLogger.log(`Busca por propriedade concluída - ${registros.length} registros encontrados`, {
        module: 'OrdenhaService',
        method: 'findAllByPropriedade',
        propriedadeId: id_propriedade,
      });

      return {
        data: formatDateFieldsArray(registros),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'findAllByPropriedade',
        propriedadeId: id_propriedade,
      });
      throw new InternalServerErrorException('Falha ao buscar os dados de lactação da propriedade.');
    }
  }

  async findAllByBufala(id_bufala: string, page = 1, limit = 20, user: any) {
    this.customLogger.log('Iniciando busca de registros de lactação por búfala', {
      module: 'OrdenhaService',
      method: 'findAllByBufala',
      bufalaId: id_bufala,
      page,
      limit,
    });
    const idUsuario = await this.authHelper.getUserId(user);

    // Etapa 1: Verificar se a búfala existe e se o usuário tem permissão para vê-la.
    const bufalaData = await this.bufaloRepository.findById(id_bufala);

    if (!bufalaData) {
      this.customLogger.warn('Búfala não encontrada', {
        module: 'OrdenhaService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
      });
      throw new NotFoundException(`Búfala com ID ${id_bufala} não encontrada.`);
    }

    // Acessando o id_dono através da relação aninhada.
    const idDonoPropriedade = bufalaData.propriedade?.idDono;

    if (!idDonoPropriedade || idDonoPropriedade !== idUsuario) {
      this.customLogger.warn('Acesso negado - usuário não tem permissão para acessar dados da búfala', {
        module: 'OrdenhaService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        userId: idUsuario,
        idDonoPropriedade,
      });
      throw new UnauthorizedException(`Você não tem permissão para acessar os dados desta búfala.`);
    }

    // Etapa 2: Buscar os registros de lactação paginados
    try {
      const { registros, total } = await this.controleRepository.listarPorBufala(id_bufala, page, limit);

      // Transformar para incluir dados da búfala e usuário como no original
      const enrichedData = registros.map((reg: any) => ({
        ...reg,
        bufalo: reg.bufalo,
        usuario: reg.usuario,
      }));

      this.customLogger.log(`Busca de registros por búfala concluída - ${registros.length} registros encontrados`, {
        module: 'OrdenhaService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        page,
        limit,
        total,
      });

      return {
        message: `Dados de lactação da búfala ${id_bufala} recuperados com sucesso`,
        total,
        page,
        limit,
        dados: formatDateFieldsArray(enrichedData),
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'findAllByBufala',
        bufalaId: id_bufala,
        page,
        limit,
      });
      throw error;
    }
  }

  async findOne(id: string, user: any) {
    this.customLogger.log('Iniciando busca de registro de lactação por ID', {
      module: 'OrdenhaService',
      method: 'findOne',
      lactacaoId: id,
    });

    const idUsuario = await this.authHelper.getUserId(user);

    const data = await this.controleRepository.buscarPorId(id);

    if (data?.idUsuario !== idUsuario) {
      this.customLogger.warn('Registro de lactação não encontrado ou não pertence ao usuário', {
        module: 'OrdenhaService',
        method: 'findOne',
        lactacaoId: id,
        userId: idUsuario,
      });
      throw new NotFoundException(`Registro de lactação com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    this.customLogger.log('Registro de lactação encontrado com sucesso', {
      module: 'OrdenhaService',
      method: 'findOne',
      lactacaoId: id,
      userId: idUsuario,
    });
    return formatDateFields(data);
  }

  async update(id: string, updateDto: UpdateDadosLactacaoDto, user: any) {
    this.customLogger.log('Iniciando atualização de registro de lactação', {
      module: 'OrdenhaService',
      method: 'update',
      lactacaoId: id,
    });

    await this.findOne(id, user);

    try {
      const data = await this.controleRepository.atualizar(id, updateDto);

      this.customLogger.log('Registro de lactação atualizado com sucesso', {
        module: 'OrdenhaService',
        method: 'update',
        lactacaoId: id,
      });
      return formatDateFields(data);
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'update',
        lactacaoId: id,
      });
      throw new InternalServerErrorException('Falha ao atualizar o dado de lactação.');
    }
  }

  async remove(id: string, user?: any) {
    return this.softDelete(id, user);
  }

  async softDelete(id: string, user?: any) {
    this.customLogger.log('Iniciando remoção de registro de lactação (soft delete)', {
      module: 'OrdenhaService',
      method: 'softDelete',
      lactacaoId: id,
    });

    if (user) {
      await this.findOne(id, user);
    }

    try {
      const data = await this.controleRepository.softDelete(id);

      this.customLogger.log('Registro de lactação removido com sucesso (soft delete)', {
        module: 'OrdenhaService',
        method: 'softDelete',
        lactacaoId: id,
      });

      return {
        message: 'Registro removido com sucesso (soft delete)',
        data: formatDateFields(data),
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'softDelete',
        lactacaoId: id,
      });
      throw new InternalServerErrorException('Falha ao remover o dado de lactação.');
    }
  }

  async restore(id: string, user?: any) {
    this.customLogger.log('Iniciando restauração de registro de lactação', {
      module: 'OrdenhaService',
      method: 'restore',
      lactacaoId: id,
    });

    try {
      const data = await this.controleRepository.restaurar(id);

      if (!data) {
        throw new NotFoundException(`Registro de lactação com ID ${id} não encontrado ou não estava deletado.`);
      }

      this.customLogger.log('Registro de lactação restaurado com sucesso', {
        module: 'OrdenhaService',
        method: 'restore',
        lactacaoId: id,
      });

      return {
        message: 'Registro restaurado com sucesso',
        data: formatDateFields(data),
      };
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'restore',
        lactacaoId: id,
      });
      throw new InternalServerErrorException('Falha ao restaurar o dado de lactação.');
    }
  }

  async findAllWithDeleted(user?: any): Promise<any[]> {
    this.customLogger.log('Buscando todos os registros de lactação incluindo deletados', {
      module: 'OrdenhaService',
      method: 'findAllWithDeleted',
    });

    try {
      const data = await this.controleRepository.listarComDeletados();
      return formatDateFieldsArray(data || []);
    } catch (error) {
      this.customLogger.logError(error, {
        module: 'OrdenhaService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar registros de lactação (incluindo deletados)');
    }
  }

  async findAllByCiclo(id_ciclo_lactacao: string, page = 1, limit = 20, user: any) {
    this.customLogger.log('Iniciando busca de registros de ordenha por ciclo', {
      module: 'OrdenhaService',
      method: 'findAllByCiclo',
      cicloId: id_ciclo_lactacao,
      page,
      limit,
    });

    const idUsuario = await this.authHelper.getUserId(user);

    // Verificar se o ciclo existe e se o usuário tem permissão
    const cicloData = await this.cicloRepository.buscarPorId(id_ciclo_lactacao);

    if (!cicloData) {
      this.customLogger.logError(new Error('Ciclo não encontrado'), {
        module: 'OrdenhaService',
        method: 'findAllByCiclo',
        cicloId: id_ciclo_lactacao,
      });
      throw new NotFoundException('Ciclo de lactação não encontrado.');
    }

    // Check property owner
    if (!cicloData.idPropriedade) {
      throw new BadRequestException('Ciclo sem propriedade associada.');
    }

    const prop = await this.propriedadeRepository.findById(cicloData.idPropriedade);

    if (prop?.idDono !== idUsuario) {
      this.customLogger.log('Usuário não autorizado a acessar este ciclo', {
        module: 'OrdenhaService',
        method: 'findAllByCiclo',
        userId: idUsuario,
        idDonoPropriedade: prop?.idDono,
      });
      throw new ForbiddenException('Você não tem permissão para acessar os dados deste ciclo de lactação.');
    }

    const { registros, total } = await this.controleRepository.listarPorCiclo(id_ciclo_lactacao, page, limit);

    return {
      data: formatDateFieldsArray(registros),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFemeasEmLactacao(id_propriedade: string): Promise<FemeaEmLactacaoDto[]> {
    this.customLogger.log('Buscando fêmeas em lactação', {
      module: 'OrdenhaService',
      method: 'findFemeasEmLactacao',
      propriedadeId: id_propriedade,
    });

    // 1. Buscar ciclos ativos (status = 'Em Lactação')
    const { registros: ciclosAtivos } = await this.cicloRepository.listarPorPropriedade(id_propriedade, 1, 1000);
    const ativos = ciclosAtivos.filter((c) => c.status === 'Em Lactação');

    if (!ativos || ativos.length === 0) {
      return [];
    }

    const resultado: FemeaEmLactacaoDto[] = [];

    for (const ciclo of ativos) {
      // Need bufalo details. listarPorPropriedade returns bufalo with nome/brinco.
      // I need dt_nascimento and id_raca.
      // I should fetch bufalo details.
      if (!ciclo.idBufala) continue;

      const bufala = await this.bufaloRepository.findById(ciclo.idBufala);
      if (!bufala) continue;

      // 2. Calcular dias em lactação
      const diasEmLactacao = Math.floor((new Date().getTime() - new Date(ciclo.dtParto).getTime()) / (1000 * 60 * 60 * 24));

      // 3. Buscar estatísticas de produção do ciclo
      const lactacoes = await this.controleRepository.listarTodosPorCiclo(ciclo.idCicloLactacao);

      const totalProduzido = lactacoes?.reduce((sum, l) => sum + (Number(l.qtOrdenha) || 0), 0) || 0;
      const diasComOrdenha = lactacoes?.length || 0;
      const mediaDiaria = diasComOrdenha > 0 ? totalProduzido / diasComOrdenha : 0;
      const ultimaOrdenha = lactacoes?.[0] || null;

      // 4. Buscar raça
      const nomeRaca = bufala.raca?.nome || 'Sem raça definida';

      // 5. Calcular idade em meses
      const idadeMeses = bufala.dtNascimento
        ? Math.floor((new Date().getTime() - new Date(bufala.dtNascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

      // 6. Contar número do ciclo
      // This requires counting cycles for this bufala.
      // I can use listarPorBufala from CicloRepository and count.
      const ciclosBufala = await this.cicloRepository.listarPorBufala(bufala.idBufalo);
      const count = ciclosBufala.length;

      resultado.push({
        idBufalo: bufala.idBufalo,
        nome: bufala.nome,
        brinco: bufala.brinco || 'Sem brinco',
        idadeMeses: idadeMeses,
        raca: nomeRaca,
        classificacao: '', // Será calculado após obter a média do rebanho
        ciclo_atual: {
          id_ciclo_lactacao: ciclo.idCicloLactacao,
          numero_ciclo: count || 0,
          dt_parto: ciclo.dtParto,
          dias_em_lactacao: diasEmLactacao,
          dt_secagem_prevista: ciclo.dtSecagemPrevista || '',
          status: ciclo.status || 'Em Lactação',
        },
        producao_atual: {
          total_produzido: parseFloat(totalProduzido.toFixed(2)),
          media_diaria: parseFloat(mediaDiaria.toFixed(2)),
          ultima_ordenha: ultimaOrdenha
            ? {
                data: ultimaOrdenha.dtOrdenha,
                quantidade: Number(ultimaOrdenha.qtOrdenha),
                periodo: ultimaOrdenha.periodo || '',
              }
            : null,
        },
      });
    }

    // 7. Calcular média do rebanho e classificar
    const mediaRebanho = resultado.length > 0 ? resultado.reduce((sum, f) => sum + f.producao_atual.total_produzido, 0) / resultado.length : 0;

    // 8. Atribuir classificação baseada na média do rebanho
    resultado.forEach((femea) => {
      const totalProduzido = femea.producao_atual.total_produzido;
      femea.classificacao =
        totalProduzido >= mediaRebanho * 1.2
          ? 'Ótima'
          : totalProduzido >= mediaRebanho
            ? 'Boa'
            : totalProduzido >= mediaRebanho * 0.8
              ? 'Mediana'
              : 'Ruim';
    });

    this.customLogger.log(`${resultado.length} fêmeas em lactação encontradas`, {
      module: 'OrdenhaService',
      method: 'findFemeasEmLactacao',
      mediaRebanho: mediaRebanho.toFixed(2),
    });

    return resultado;
  }

  async getResumoProducaoBufala(id_bufala: string, user: any): Promise<ResumoProducaoBufalaDto> {
    this.customLogger.log('Buscando resumo de produção da búfala', {
      module: 'OrdenhaService',
      method: 'getResumoProducaoBufala',
      bufalaId: id_bufala,
    });

    // 1. Buscar dados da búfala
    const bufala = await this.bufaloRepository.findById(id_bufala);

    if (!bufala) {
      throw new NotFoundException(`Búfala com ID ${id_bufala} não encontrada.`);
    }

    // 2. Buscar ciclo atual (ativo)
    const cicloAtual = await this.cicloRepository.buscarCicloAtivo(id_bufala);

    let cicloAtualProcessado: any = null;

    if (cicloAtual) {
      const diasEmLactacao = Math.floor((new Date().getTime() - new Date(cicloAtual.dtParto).getTime()) / (1000 * 60 * 60 * 24));

      const ordenhasCiclo = await this.controleRepository.listarTodosPorCiclo(cicloAtual.idCicloLactacao);

      const totalProduzido = ordenhasCiclo?.reduce((sum, o) => sum + (Number(o.qtOrdenha) || 0), 0) || 0;
      const diasComOrdenha = ordenhasCiclo?.length || 0;
      const mediaDiaria = diasComOrdenha > 0 ? totalProduzido / diasComOrdenha : 0;
      const ultimaOrdenha = ordenhasCiclo?.[0] || null;

      // Contar número do ciclo
      const ciclosBufala = await this.cicloRepository.listarPorBufala(id_bufala);
      // Filter cycles before or equal to current
      const count = ciclosBufala.filter((c) => new Date(c.dtParto) <= new Date(cicloAtual.dtParto)).length;

      cicloAtualProcessado = {
        id_ciclo_lactacao: cicloAtual.idCicloLactacao,
        numero_ciclo: count || 1,
        dt_parto: cicloAtual.dtParto,
        dias_em_lactacao: diasEmLactacao,
        total_produzido: parseFloat(totalProduzido.toFixed(2)),
        media_diaria: parseFloat(mediaDiaria.toFixed(2)),
        dt_secagem_prevista: cicloAtual.dtSecagemPrevista,
        ultima_ordenha: ultimaOrdenha
          ? {
              data: ultimaOrdenha.dtOrdenha,
              quantidade: Number(ultimaOrdenha.qtOrdenha),
              periodo: ultimaOrdenha.periodo,
            }
          : null,
      };
    }

    // 3. Buscar ciclos anteriores finalizados
    const ciclosBufala = await this.cicloRepository.listarPorBufala(id_bufala);
    const ciclosAnteriores = ciclosBufala
      .filter((c) => c.status === 'Seca')
      .sort((a, b) => new Date(a.dtParto).getTime() - new Date(b.dtParto).getTime());

    const comparativoCiclos: any[] = [];

    if (ciclosAnteriores) {
      for (const ciclo of ciclosAnteriores) {
        const dtParto = new Date(ciclo.dtParto);
        const dtSecagem = ciclo.dtSecagemReal ? new Date(ciclo.dtSecagemReal) : null;
        const duracaoDias = dtSecagem ? Math.floor((dtSecagem.getTime() - dtParto.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        const ordenhas = await this.controleRepository.listarTodosPorCiclo(ciclo.idCicloLactacao);

        const totalProduzido = ordenhas?.reduce((sum, o) => sum + (Number(o.qtOrdenha) || 0), 0) || 0;
        const mediaDiaria = duracaoDias > 0 ? totalProduzido / duracaoDias : 0;

        const count = ciclosBufala.filter((c) => new Date(c.dtParto) <= new Date(ciclo.dtParto)).length;

        comparativoCiclos.push({
          id_ciclo_lactacao: ciclo.idCicloLactacao,
          numero_ciclo: count || 0,
          dt_parto: ciclo.dtParto,
          dt_secagem: ciclo.dtSecagemReal,
          total_produzido: parseFloat(totalProduzido.toFixed(2)),
          media_diaria: parseFloat(mediaDiaria.toFixed(2)),
          duracao_dias: duracaoDias,
        });
      }
    }

    // 4. Gráfico de produção (últimos 30 dias)
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);

    const ordenhasRecentes = await this.controleRepository.listarRecentesPorBufala(id_bufala, dataInicio);

    // Agrupar por data
    const producaoPorDia = new Map<string, number>();
    ordenhasRecentes?.forEach((ordenha) => {
      const data = ordenha.dtOrdenha.split('T')[0];
      const atual = producaoPorDia.get(data) || 0;
      producaoPorDia.set(data, atual + (Number(ordenha.qtOrdenha) || 0));
    });

    const graficoProducao = Array.from(producaoPorDia.entries())
      .map(([data, quantidade]) => ({
        data,
        quantidade: parseFloat(quantidade.toFixed(2)),
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return {
      bufala: {
        id: bufala.idBufalo,
        nome: bufala.nome,
        brinco: bufala.brinco || 'Sem brinco',
      },
      ciclo_atual: formatDateFields(cicloAtualProcessado),
      comparativo_ciclos: formatDateFieldsArray(comparativoCiclos),
      grafico_producao: graficoProducao,
    };
  }
}
