import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { CreateCoberturaDto } from './dto/create-cobertura.dto';
import { UpdateCoberturaDto } from './dto/update-cobertura.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { FemeaDisponivelReproducaoDto } from './dto/femea-disponivel-reproducao.dto';
import { RegistrarPartoDto } from './dto/registrar-parto.dto';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { RecomendacaoFemeaDto, RecomendacaoMachoDto, MotivoScore } from './dto/recomendacao-acasalamento.dto';
import { CoberturaValidatorDrizzle } from './validators/cobertura.validator.drizzle';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { CacheService } from '../../../core/cache/cache.service';
import {
  calcularIAR,
  calcularFPProntidao,
  calcularFPIdade,
  calcularFPHistorico,
  calcularFPLactacao,
  gerarMotivosIAR,
  type FatoresPonderacao,
} from './utils/calcular-iar.util';
import { calcularIVR, calcularMediaRebanho, gerarMotivosIVR, type DadosIVR } from './utils/calcular-ivr.util';
import {
  buscarCicloAtivo,
  contarCiclosTotais,
  calcularIEPMedio,
  buscarHistoricoCoberturasTouro,
  estatisticasRebanho,
} from './utils/reproducao-queries-drizzle.util';
import { calcularIdadeEmMeses, determinarStatusFemea } from './utils/reproducao-helpers.util';
import { CoberturaRepositoryDrizzle } from './repositories/cobertura.repository.drizzle';
import { mapCoberturaResponse, mapCoberturasResponse } from './mappers/cobertura.mapper';

@Injectable()
export class CoberturaService implements ISoftDelete {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly alertasService: AlertasService,
    private readonly validator: CoberturaValidatorDrizzle,
    private readonly coberturaRepo: CoberturaRepositoryDrizzle,
    private readonly cacheService: CacheService,
  ) {}

  async create(dto: CreateCoberturaDto, auth_uuid: string) {
    // ============================================================
    // 1. VALIDAR CONSISTÊNCIA DOS CAMPOS POR TIPO DE INSEMINAÇÃO
    // ============================================================
    if (dto.tipoInseminacao === 'Monta Natural') {
      if (!dto.idBufalo) {
        throw new BadRequestException('Monta Natural requer idBufalo (macho reprodutor)');
      }
      if (dto.idSemen) {
        throw new BadRequestException('Monta Natural não deve ter idSemen');
      }
      if (dto.idDoadora) {
        throw new BadRequestException('Monta Natural não deve ter idDoadora');
      }
    }

    if (dto.tipoInseminacao === 'IA' || dto.tipoInseminacao === 'IATF') {
      if (!dto.idSemen) {
        const tipoNome = dto.tipoInseminacao === 'IA' ? 'IA (Inseminação Artificial)' : 'IATF (Inseminação Artificial em Tempo Fixo)';
        throw new BadRequestException(`${tipoNome} requer idSemen (material genético)`);
      }
      if (dto.idDoadora) {
        throw new BadRequestException('IA e IATF não devem ter idDoadora (apenas TE usa doadora)');
      }
    }

    if (dto.tipoInseminacao === 'TE') {
      if (!dto.idSemen) {
        throw new BadRequestException('TE (Transferência de Embrião) requer idSemen (embrião)');
      }
      if (!dto.idDoadora) {
        throw new BadRequestException('TE (Transferência de Embrião) requer idDoadora (búfala doadora do óvulo)');
      }
    }

    // ============================================================
    // 2. VALIDAR FÊMEA RECEPTORA
    // ============================================================
    if (dto.idBufala && dto.dtEvento) {
      await this.validator.validarAnimalAtivo(dto.idBufala);
      await this.validator.validarGestacaoDuplicada(dto.idBufala, dto.dtEvento);
      await this.validator.validarIdadeMinimaReproducao(dto.idBufala, 'F');
      await this.validator.validarIdadeMaximaReproducao(dto.idBufala, 'F');
      await this.validator.validarIntervaloEntrePartos(dto.idBufala, dto.dtEvento);
    }

    // ============================================================
    // 3. VALIDAR MACHO REPRODUTOR (se Monta Natural)
    // ============================================================
    if (dto.idBufalo) {
      await this.validator.validarAnimalAtivo(dto.idBufalo);
      await this.validator.validarIdadeMinimaReproducao(dto.idBufalo, 'M');
      await this.validator.validarIdadeMaximaReproducao(dto.idBufalo, 'M');
      await this.validator.validarIntervaloUsoMacho(dto.idBufalo, dto.dtEvento);

      // Verificar que é realmente macho
      const macho = await this.databaseService.db.query.bufalo.findFirst({
        where: (bufalo, { eq }) => eq(bufalo.idBufalo, dto.idBufalo),
        columns: {
          sexo: true,
          nome: true,
        },
      });

      if (!macho) {
        throw new BadRequestException(`Reprodutor não encontrado: ${dto.idBufalo}`);
      }

      if (macho.sexo !== 'M') {
        throw new BadRequestException(`Animal "${macho.nome}" não é macho. Para Monta Natural, idBufalo deve ser um búfalo macho.`);
      }
    }

    // ============================================================
    // 4. VALIDAR BÚFALA DOADORA (se TE - Transferência de Embrião)
    // ============================================================
    if (dto.idDoadora) {
      await this.validator.validarAnimalAtivo(dto.idDoadora);
      await this.validator.validarIdadeMinimaReproducao(dto.idDoadora, 'F');
      await this.validator.validarIdadeMaximaReproducao(dto.idDoadora, 'F');

      // Verificar que é realmente fêmea
      const doadora = await this.databaseService.db.query.bufalo.findFirst({
        where: (bufalo, { eq }) => eq(bufalo.idBufalo, dto.idDoadora),
        columns: {
          sexo: true,
          nome: true,
        },
      });

      if (!doadora) {
        throw new BadRequestException(`Doadora não encontrada: ${dto.idDoadora}`);
      }

      if (doadora.sexo !== 'F') {
        throw new BadRequestException(`Animal "${doadora.nome}" não é fêmea. Para TE, idDoadora deve ser uma búfala fêmea.`);
      }
    }

    // ============================================================
    // 5. VALIDAR MATERIAL GENÉTICO (se IA, IATF ou TE)
    // ============================================================
    if (dto.idSemen) {
      const semen = await this.databaseService.db.query.materialgenetico.findFirst({
        where: (materialgenetico, { eq }) => eq(materialgenetico.idMaterial, dto.idSemen),
        columns: {
          idMaterial: true,
          tipo: true,
          ativo: true,
        },
      });

      if (!semen) {
        throw new BadRequestException(`Material genético não encontrado: ${dto.idSemen}`);
      }

      if (!semen.ativo) {
        throw new BadRequestException(`Material genético está inativo e não pode ser utilizado`);
      }

      // Validar tipo de material conforme técnica (IA e IATF usam Sêmen)
      if ((dto.tipoInseminacao === 'IA' || dto.tipoInseminacao === 'IATF') && semen.tipo !== 'Sêmen') {
        throw new BadRequestException('IA e IATF requerem material genético do tipo "Sêmen"');
      }

      // TE usa Embrião
      if (dto.tipoInseminacao === 'TE' && semen.tipo !== 'Embrião') {
        throw new BadRequestException('TE (Transferência de Embrião) requer material genético do tipo "Embrião"');
      }
    }

    // ============================================================
    // 6. INSERIR NO BANCO
    // ============================================================
    const dtoComStatus = {
      ...dto,
      status: dto.status || 'Em andamento',
    };

    const data = await this.coberturaRepo.create(dtoComStatus);

    // Buscar novamente com joins para retornar dados completos
    const coberturaCompleta = await this.coberturaRepo.findById(data.idReproducao);

    if (!coberturaCompleta) {
      // Se falhar ao buscar com joins, retorna o dado básico
      return data;
    }

    // Mapear dados para incluir informações dos animais
    return mapCoberturaResponse(coberturaCompleta);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const result = await this.coberturaRepo.findAll(offset, limitValue);

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturasResponse(result.data);
    return createPaginatedResponse(mappedData, result.total, page, limitValue);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

    const result = await this.coberturaRepo.findByPropriedade(id_propriedade, offset, limitValue);

    // Mapear dados para incluir informações dos animais
    const mappedData = mapCoberturasResponse(result.data);
    return createPaginatedResponse(mappedData, result.total, page, limitValue);
  }

  async findOne(id_repro: string) {
    const data = await this.coberturaRepo.findById(id_repro);

    if (!data) {
      throw new NotFoundException(`Dado de reprodução com ID ${id_repro} não encontrado.`);
    }

    // Mapear dados para incluir informações dos animais
    return mapCoberturaResponse(data);
  }

  async update(id_repro: string, dto: UpdateCoberturaDto) {
    const cobertura = await this.findOne(id_repro);

    // Validar se pode atualizar tipo_parto
    if (dto.tipo_parto) {
      if (cobertura.status !== 'Confirmada') {
        throw new BadRequestException(
          'Apenas coberturas com status "Confirmada" podem ter tipo_parto atualizado. Use o endpoint POST /cobertura/:id/registrar-parto para finalizar o processo.',
        );
      }

      // Validar valores permitidos
      const tiposPartoValidos = ['Normal', 'Cesárea', 'Aborto'];
      if (!tiposPartoValidos.includes(dto.tipo_parto)) {
        throw new BadRequestException(`tipo_parto inválido. Valores permitidos: ${tiposPartoValidos.join(', ')}. Recebido: ${dto.tipo_parto}`);
      }

      // Alertar sobre uso incorreto - deve usar registrarParto
      console.warn(
        `⚠️ AVISO: tipo_parto sendo atualizado diretamente via PATCH. Recomenda-se usar POST /cobertura/${id_repro}/registrar-parto para fluxo completo (parto + ciclo de lactação + alertas).`,
      );
    }

    const data = await this.coberturaRepo.update(id_repro, dto);

    if (!data) {
      throw new InternalServerErrorException('Falha ao atualizar dado de reprodução');
    }

    // Buscar novamente com joins
    const coberturaCompleta = await this.coberturaRepo.findById(id_repro);
    return coberturaCompleta ? mapCoberturaResponse(coberturaCompleta) : data;
  }

  async remove(id_repro: string) {
    return this.softDelete(id_repro);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const data = await this.coberturaRepo.softDelete(id);

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data,
    };
  }

  async restore(id: string) {
    const cobertura = await this.coberturaRepo.findByIdSimple(id);

    if (!cobertura) {
      throw new NotFoundException(`Registro de reprodução com ID ${id} não encontrado`);
    }

    if (!cobertura.deletedAt) {
      throw new BadRequestException('Este registro não está removido');
    }

    const data = await this.coberturaRepo.restore(id);

    return {
      message: 'Registro restaurado com sucesso',
      data,
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const data = await this.coberturaRepo.findAllWithDeleted();

    // Mapear dados para incluir informações dos animais
    return mapCoberturasResponse(data || []);
  }

  /**
   * Busca fêmeas disponíveis para reprodução
   */
  async findFemeasDisponiveisReproducao(
    id_propriedade: string,
    filtro: 'todas' | 'solteiras' | 'vazias' | 'aptas' = 'aptas',
  ): Promise<FemeaDisponivelReproducaoDto[]> {
    // 1. Buscar todas as fêmeas ativas da propriedade com idade reprodutiva (18+ meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

    const femeas = await this.databaseService.db.query.bufalo.findMany({
      where: (bufalo, { eq, and, lte }) =>
        and(
          eq(bufalo.idPropriedade, id_propriedade),
          eq(bufalo.sexo, 'F'),
          eq(bufalo.status, true),
          lte(bufalo.dtNascimento, idadeMinimaReproducao.toISOString()),
        ),
      columns: {
        idBufalo: true,
        nome: true,
        brinco: true,
        dtNascimento: true,
        idRaca: true,
      },
    });

    if (!femeas || femeas.length === 0) {
      return [];
    }

    const resultado: FemeaDisponivelReproducaoDto[] = [];

    for (const femea of femeas) {
      // 2. Buscar última cobertura
      const coberturas = await this.databaseService.db.query.dadosreproducao.findMany({
        where: (dadosreproducao, { eq }) => eq(dadosreproducao.idBufala, femea.idBufalo),
        orderBy: (dadosreproducao, { desc }) => [desc(dadosreproducao.dtEvento)],
        limit: 1,
        columns: {
          dtEvento: true,
          status: true,
        },
      });

      const ultimaCobertura = coberturas?.[0] || null;
      const dtUltimaCobertura = ultimaCobertura?.dtEvento || null;
      const diasDesdeCobertura = dtUltimaCobertura
        ? Math.floor((new Date().getTime() - new Date(dtUltimaCobertura).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // 3. Buscar ciclo de lactação ativo
      const cicloAtivo = await this.databaseService.db.query.ciclolactacao.findFirst({
        where: (ciclolactacao, { eq, and }) => and(eq(ciclolactacao.idBufala, femea.idBufalo), eq(ciclolactacao.status, 'Em Lactação')),
        columns: {
          idCicloLactacao: true,
          dtParto: true,
          status: true,
        },
      });

      let diasEmLactacao = 0;
      let numeroCiclo = 0;
      if (cicloAtivo) {
        diasEmLactacao = Math.floor((new Date().getTime() - new Date(cicloAtivo.dtParto).getTime()) / (1000 * 60 * 60 * 24));
        numeroCiclo = await contarCiclosTotais(this.databaseService, femea.idBufalo);
      }

      // 4. Determinar status reprodutivo
      let statusReprodutivo = 'Disponível';
      const recomendacoes: string[] = [];

      // Período pós-parto mínimo: 45 dias
      if (cicloAtivo && diasEmLactacao < 45) {
        statusReprodutivo = 'Período Pós-Parto';
        recomendacoes.push(`Aguardar mais ${45 - diasEmLactacao} dias antes de cobrir (período pós-parto)`);
      }

      // Cobertura recente aguardando diagnóstico (30-90 dias)
      if (ultimaCobertura?.status === 'Em andamento' && diasDesdeCobertura && diasDesdeCobertura >= 30 && diasDesdeCobertura <= 90) {
        statusReprodutivo = 'Aguardando Diagnóstico';
        recomendacoes.push('Realizar diagnóstico de prenhez');
      }

      // Filtrar baseado no tipo solicitado
      const incluir =
        filtro === 'todas' ||
        (filtro === 'solteiras' && !ultimaCobertura) ||
        (filtro === 'vazias' && ultimaCobertura?.status === 'Falhou') ||
        (filtro === 'aptas' && statusReprodutivo === 'Disponível');

      if (!incluir) continue;

      // 5. Buscar raça
      let nomeRaca = 'Sem raça definida';
      if (femea.idRaca) {
        const raca = await this.databaseService.db.query.raca.findFirst({
          where: (raca, { eq }) => eq(raca.idRaca, femea.idRaca),
          columns: { nome: true },
        });
        if (raca) nomeRaca = raca.nome;
      }

      // 6. Calcular idade
      const idadeMeses = femea.dtNascimento
        ? Math.floor((new Date().getTime() - new Date(femea.dtNascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

      // Recomendações adicionais
      if (statusReprodutivo === 'Disponível') {
        if (cicloAtivo && diasEmLactacao >= 60 && diasEmLactacao <= 120) {
          recomendacoes.push('Período ideal para cobertura pós-parto (60-120 dias)');
        }
        if (!cicloAtivo && !ultimaCobertura) {
          recomendacoes.push('Primeira cobertura - verificar cio antes de proceder');
        }
      }

      resultado.push({
        idBufalo: femea.idBufalo,
        nome: femea.nome,
        brinco: femea.brinco || 'Sem brinco',
        idadeMeses: idadeMeses,
        raca: nomeRaca,
        ultima_cobertura: dtUltimaCobertura,
        dias_desde_ultima_cobertura: diasDesdeCobertura,
        status_reprodutivo: statusReprodutivo,
        ciclo_atual: cicloAtivo
          ? {
              numero_ciclo: numeroCiclo,
              dias_em_lactacao: diasEmLactacao,
              status: cicloAtivo.status || 'Em Lactação',
            }
          : null,
        recomendacoes,
      });
    }

    return resultado;
  }

  /**
   * Registra parto e cria ciclo de lactação automaticamente
   */
  async registrarParto(id_repro: string, dto: RegistrarPartoDto) {
    // 1. Buscar cobertura
    const cobertura = await this.findOne(id_repro);

    if (cobertura.status !== 'Confirmada') {
      throw new BadRequestException('Apenas coberturas confirmadas (prenhez confirmada) podem ter parto registrado.');
    }

    // 2. Atualizar cobertura com dados do parto usando repository
    const coberturaAtualizada = await this.coberturaRepo.update(id_repro, {
      tipo_parto: dto.tipo_parto,
      status: 'Concluída',
    });

    if (!coberturaAtualizada) {
      throw new InternalServerErrorException('Falha ao atualizar cobertura');
    }

    let cicloLactacao: any = null;

    // 3. Criar ciclo de lactação automaticamente (apenas para partos normais e cesárea)
    if (dto.criar_ciclo_lactacao !== false && (dto.tipo_parto === 'Normal' || dto.tipo_parto === 'Cesárea')) {
      const cicloData = {
        idBufala: cobertura.id_bufala,
        idPropriedade: cobertura.id_propriedade,
        dtParto: dto.dt_parto,
        padraoDias: dto.padrao_dias_lactacao || 305,
        observacao: dto.observacao || `Ciclo criado automaticamente a partir do parto registrado em ${new Date().toLocaleDateString()}`,
      };

      const { ciclolactacao } = await import('../../../database/schema');
      const ciclos = await this.databaseService.db.insert(ciclolactacao).values(cicloData).returning();
      const ciclo = ciclos[0];

      if (!ciclo) {
        console.warn('Erro ao criar ciclo de lactação');
      } else {
        cicloLactacao = ciclo;

        // 4. CRIAR ALERTA AUTOMÁTICO PARA SECAGEM (60 dias antes do previsto)
        try {
          const dtParto = new Date(dto.dt_parto);
          const padrãoDias = dto.padrao_dias_lactacao || 305;
          const dtSecagemPrevista = new Date(dtParto);
          dtSecagemPrevista.setDate(dtParto.getDate() + padrãoDias);

          // Alerta 60 dias antes da secagem prevista
          const dtAlertaSecagem = new Date(dtSecagemPrevista);
          dtAlertaSecagem.setDate(dtSecagemPrevista.getDate() - 60);

          // Buscar informações da búfala para o alerta
          const bufalaData = await this.databaseService.db.query.bufalo.findFirst({
            where: (bufalo, { eq }) => eq(bufalo.idBufalo, cobertura.id_bufala),
            columns: {
              idBufalo: true,
              nome: true,
              idGrupo: true,
              idPropriedade: true,
            },
          });

          if (bufalaData) {
            // Buscar nome do grupo
            let grupoNome = 'Não informado';
            if (bufalaData.idGrupo) {
              const grupoData = await this.databaseService.db.query.grupo.findFirst({
                where: (grupo, { eq }) => eq(grupo.idGrupo, bufalaData.idGrupo),
                columns: { nomeGrupo: true },
              });
              if (grupoData) {
                grupoNome = grupoData.nomeGrupo;
              }
            }

            // Buscar nome da propriedade
            let propriedadeNome = 'Não informada';
            const propriedadeId = cobertura.id_propriedade || bufalaData.idPropriedade;
            if (propriedadeId) {
              const propData = await this.databaseService.db.query.propriedade.findFirst({
                where: (propriedade, { eq }) => eq(propriedade.idPropriedade, propriedadeId),
                columns: { nome: true },
              });
              if (propData) {
                propriedadeNome = propData.nome;
              }
            }

            // Criar alerta
            await this.alertasService.createIfNotExists({
              animal_id: bufalaData.idBufalo,
              grupo: grupoNome,
              localizacao: propriedadeNome,
              id_propriedade: propriedadeId,
              motivo: `Preparar para secagem da búfala ${bufalaData.nome}. Lactação prevista até ${dtSecagemPrevista.toLocaleDateString('pt-BR')}.`,
              nicho: NichoAlerta.MANEJO,
              data_alerta: dtAlertaSecagem.toISOString().split('T')[0],
              prioridade: PrioridadeAlerta.MEDIA,
              observacao: `Ciclo iniciado em ${dtParto.toLocaleDateString('pt-BR')}. Duração padrão: ${padrãoDias} dias. Iniciar protocolo de secagem 60 dias antes.`,
              id_evento_origem: ciclo.idCicloLactacao,
              tipo_evento_origem: 'CICLO_LACTACAO',
            });

            console.log(`✅ Alerta de secagem criado automaticamente para ${bufalaData.nome}`);
          }
        } catch (alertaError) {
          // Não bloqueia o fluxo se o alerta falhar
          console.error('⚠️ Erro ao criar alerta de secagem:', alertaError);
        }
      }
    }

    return {
      cobertura: mapCoberturaResponse(coberturaAtualizada),
      ciclo_lactacao: cicloLactacao,
      message: cicloLactacao ? 'Parto registrado, ciclo de lactação criado e alerta de secagem agendado com sucesso' : 'Parto registrado com sucesso',
    };
  }

  /**
   * Retorna recomendações ranqueadas de fêmeas para acasalamento
   * Baseado no Índice de Aptidão Reprodutiva (IAR)
   *
   * IAR = (FP_Prontidao * 0.50) + (FP_Idade * 0.15) + (FP_Historico * 0.20) + (FP_Lactacao * 0.15)
   *
   * Fatores:
   * - FP_Prontidao (50%): Prontidão fisiológica baseada em DPP ou idade (novilha)
   * - FP_Idade (15%): Janela de idade produtiva
   * - FP_Historico (20%): Eficiência reprodutiva histórica (IEP médio)
   * - FP_Lactacao (15%): Modulador de lactação (penaliza pico)
   */
  async findRecomendacoesFemeas(id_propriedade: string, limit?: number): Promise<RecomendacaoFemeaDto[]> {
    // 1. Buscar todas as fêmeas ativas da propriedade com idade mínima reprodutiva (18 meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 18);

    const femeas = await this.databaseService.db.query.bufalo.findMany({
      where: (bufalo, { eq, and, lte, isNull }) =>
        and(
          eq(bufalo.idPropriedade, id_propriedade),
          eq(bufalo.sexo, 'F'),
          eq(bufalo.status, true),
          lte(bufalo.dtNascimento, idadeMinimaReproducao.toISOString()),
          isNull(bufalo.deletedAt),
        ),
      columns: {
        idBufalo: true,
        nome: true,
        brinco: true,
        dtNascimento: true,
        idRaca: true,
      },
      with: {
        raca: {
          columns: {
            nome: true,
          },
        },
      },
    });

    if (!femeas || femeas.length === 0) {
      return [];
    }

    const recomendacoes: RecomendacaoFemeaDto[] = [];

    for (const femea of femeas) {
      // 2. Calcular idade em meses
      const idadeMeses = calcularIdadeEmMeses(femea.dtNascimento);

      // 3. Buscar ciclo de lactação ativo (mais recente)
      const cicloAtivo = await buscarCicloAtivo(this.databaseService, femea.idBufalo);

      // 4. Contar total de ciclos (número de partos)
      const totalCiclos = await contarCiclosTotais(this.databaseService, femea.idBufalo);

      // 5. Calcular dias pós-parto (DPP)
      let diasPosParto: number | null = null;
      let diasEmLactacao: number | null = null;
      let statusLactacao = 'Seca';

      if (cicloAtivo) {
        diasPosParto = Math.floor((Date.now() - new Date(cicloAtivo.dtParto).getTime()) / (1000 * 60 * 60 * 24));

        if (cicloAtivo.status === 'Em Lactação') {
          diasEmLactacao = diasPosParto;
          statusLactacao = 'Em Lactação';
        }
      }

      // 6. Calcular IEP médio (se >= 2 partos)
      const iepMedio = await calcularIEPMedio(this.databaseService, femea.idBufalo, totalCiclos);

      // 7. Calcular fatores do IAR
      const fp_prontidao = calcularFPProntidao(totalCiclos, idadeMeses, diasPosParto);
      const fp_idade = calcularFPIdade(idadeMeses, totalCiclos);
      const fp_historico = calcularFPHistorico(totalCiclos, iepMedio);
      const fp_lactacao = calcularFPLactacao(statusLactacao, diasEmLactacao);

      // 8. Calcular IAR final
      const fatores: FatoresPonderacao = {
        fp_prontidao,
        fp_idade,
        fp_historico,
        fp_lactacao,
      };

      const score = calcularIAR(fatores);

      // 9. Gerar motivos
      const motivosTexto = gerarMotivosIAR(fatores, totalCiclos, diasPosParto, idadeMeses, iepMedio, diasEmLactacao);
      const motivos: MotivoScore[] = motivosTexto.map((descricao) => ({ descricao }));

      // 10. Determinar status reprodutivo
      const status = determinarStatusFemea(fp_prontidao, totalCiclos, diasPosParto);

      // 11. Montar resposta
      const recomendacao: RecomendacaoFemeaDto = {
        idBufalo: femea.idBufalo,
        nome: femea.nome,
        brinco: femea.brinco || 'S/N',
        idadeMeses: idadeMeses,
        raca: (femea as any).raca?.nome || 'Não informada',
        dados_reprodutivos: {
          status,
          dias_pos_parto: diasPosParto,
          dias_em_lactacao: diasEmLactacao,
          numero_ciclos: totalCiclos,
          iep_medio_dias: iepMedio,
        },
        score,
        motivos,
      };

      recomendacoes.push(recomendacao);
    }

    // Ordenar por score decrescente
    const recomendacoesOrdenadas = recomendacoes.sort((a, b) => b.score - a.score);

    // Aplicar limite se especificado
    return limit ? recomendacoesOrdenadas.slice(0, limit) : recomendacoesOrdenadas;
  }

  /**
   * Retorna recomendações ranqueadas de machos para acasalamento
   * Baseado no Índice de Valor Reprodutivo (IVR)
   *
   * IVR usa Taxa de Concepção Ajustada (TCA) com Regressão Bayesiana:
   * TCA = ((N * TCB) + (K * MR)) / (N + K)
   *
   * Onde:
   * - N = número de coberturas do touro
   * - TCB = Taxa de Concepção Bruta do touro
   * - K = fator de confiabilidade (20)
   * - MR = Média do Rebanho (taxa de concepção média da propriedade)
   *
   * Usa tipo_parto como indicador de sucesso (Normal/Cesárea = prenhez confirmada)
   */
  async findRecomendacoesMachos(id_propriedade: string, limit?: number): Promise<RecomendacaoMachoDto[]> {
    // 1. Calcular média do rebanho (MR_TC) - estatística global da propriedade
    const { totalPrenhezes, totalCoberturas } = await estatisticasRebanho(this.databaseService, id_propriedade);
    const mr_tc = calcularMediaRebanho(totalPrenhezes, totalCoberturas);

    // 2. Buscar todos os machos ativos da propriedade com idade mínima reprodutiva (24 meses)
    const idadeMinimaReproducao = new Date();
    idadeMinimaReproducao.setMonth(idadeMinimaReproducao.getMonth() - 24);

    const machos = await this.databaseService.db.query.bufalo.findMany({
      where: (bufalo, { eq, and, lte, isNull }) =>
        and(
          eq(bufalo.idPropriedade, id_propriedade),
          eq(bufalo.sexo, 'M'),
          eq(bufalo.status, true),
          lte(bufalo.dtNascimento, idadeMinimaReproducao.toISOString()),
          isNull(bufalo.deletedAt),
        ),
      columns: {
        idBufalo: true,
        nome: true,
        brinco: true,
        dtNascimento: true,
        categoria: true,
        idRaca: true,
      },
      with: {
        raca: {
          columns: {
            nome: true,
          },
        },
      },
    });

    if (!machos || machos.length === 0) {
      return [];
    }

    const recomendacoes: RecomendacaoMachoDto[] = [];

    for (const macho of machos) {
      // 3. Calcular idade em meses
      const idadeMeses = calcularIdadeEmMeses(macho.dtNascimento);

      // 4. Buscar histórico de coberturas do touro
      const historico = await buscarHistoricoCoberturasTouro(this.databaseService, macho.idBufalo);

      const n_touro = historico.total_coberturas;
      const totalPrenhezes = historico.total_prenhezes;
      const tcb_touro = n_touro > 0 ? (totalPrenhezes / n_touro) * 100 : 0;

      // 5. Calcular IVR usando regressão bayesiana
      const dadosIVR: DadosIVR = {
        n_touro,
        tcb_touro,
        mr_tc,
      };

      const resultado = calcularIVR(dadosIVR);

      // 6. Gerar motivos (justificativas)
      const motivosTexto = gerarMotivosIVR(resultado, n_touro, tcb_touro);
      const motivos: MotivoScore[] = motivosTexto.map((descricao) => ({ descricao }));

      // 7. Montar resposta
      const recomendacao: RecomendacaoMachoDto = {
        idBufalo: macho.idBufalo,
        nome: macho.nome,
        brinco: macho.brinco || 'S/N',
        idadeMeses: idadeMeses,
        raca: (macho as any).raca?.nome || 'Não informada',
        categoria_abcb: macho.categoria || null,
        dados_reprodutivos: {
          total_coberturas: n_touro,
          total_prenhezes: totalPrenhezes,
          taxa_concepcao_bruta: tcb_touro,
          taxa_concepcao_ajustada: resultado.tca,
          confiabilidade: resultado.confiabilidade,
          ultima_cobertura: historico.ultima_cobertura,
          dias_desde_ultima_cobertura: historico.dias_desde_ultima,
        },
        score: resultado.score,
        motivos,
      };

      recomendacoes.push(recomendacao);
    }

    // Ordenar por score decrescente
    const recomendacoesOrdenadas = recomendacoes.sort((a, b) => b.score - a.score);

    // Aplicar limite se especificado
    return limit ? recomendacoesOrdenadas.slice(0, limit) : recomendacoesOrdenadas;
  }
}
