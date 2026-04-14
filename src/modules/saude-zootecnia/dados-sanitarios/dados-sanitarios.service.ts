import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateDadosSanitariosDto } from './dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from './dto/update-dados-sanitarios.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { FrequenciaDoencasResponseDto } from './dto/frequencia-doencas.dto';
import { StringSimilarityUtil } from '../../../core/utils/string-similarity.utils';
import { DoencaNormalizerUtil } from './utils/doenca-normalizer.utils';
import { AlertasService } from '../../alerta/alerta.service';
import { NichoAlerta, PrioridadeAlerta } from '../../alerta/dto/create-alerta.dto';
import { ISoftDelete } from '../../../core/interfaces';
import { DadosSanitariosRepositoryDrizzle } from './repositories';
import { DatabaseService } from '../../../core/database/database.service';
import { UserHelper } from '../../../core/utils';
import { getErrorMessage } from '../../../core/utils/error.utils';
import { bufalo } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { AuthHelperService } from '../../../core/services/auth-helper.service';

@Injectable()
export class DadosSanitariosService implements ISoftDelete {
  constructor(
    private readonly repository: DadosSanitariosRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly databaseService: DatabaseService,
    private readonly authHelper: AuthHelperService,
    @Optional() private readonly alertasService?: AlertasService,
  ) {}

  /**
   * Normaliza o nome da doença para o nome correto
   * Usa o dicionário de doenças conhecidas e algoritmo de similaridade
   * para corrigir automaticamente erros de digitação
   */
  private normalizeDoenca(doenca: string | undefined): string | undefined {
    if (!doenca) return undefined;

    return DoencaNormalizerUtil.normalize(doenca, 0.85);
  }

  /**
   * O parâmetro 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadosSanitariosDto, auth_uuid: string) {
    // 1. Validar se a medicação existe
    const medicacao = await this.repository.findMedicacaoById(dto.idMedicao);

    if (!medicacao) {
      throw new BadRequestException(`Medicação com ID ${dto.idMedicao} não encontrada.`);
    }

    // 2. Buscar ID interno do usuário via helper
    const internalUserId = await UserHelper.getInternalUserId(this.databaseService, auth_uuid);

    // 3. Normalizar o nome da doença antes de salvar
    const doencaNormalizada = this.normalizeDoenca(dto.doenca);

    // 4. Inserir no banco de dados
    const data = await this.repository.create(dto, internalUserId, doencaNormalizada);

    // 5. CRIAR ALERTA CLÍNICO AUTOMÁTICO para doenças graves
    try {
      if (!this.alertasService) {
        this.logger.warn('AlertasService indisponível - criação de alerta clínico ignorada', {
          module: 'DadosSanitariosService',
          method: 'create',
        });
        return formatDateFields(data);
      }

      const doencasGraves = [
        'brucelose',
        'tuberculose',
        'raiva',
        'carbúnculo',
        'mastite gangrenosa',
        'pneumonia severa',
        'septicemia',
        'leptospirose',
        'febre aftosa',
      ];

      const doencaLower = doencaNormalizada?.toLowerCase() || '';
      const isGrave = doencasGraves.some((grave) => doencaLower.includes(grave));

      if (isGrave) {
        // Buscar informações do búfalo usando Drizzle
        const bufaloData = await this.databaseService.db.query.bufalo.findFirst({
          where: eq(bufalo.idBufalo, dto.idBufalo),
          with: {
            grupo: {
              columns: {
                nomeGrupo: true,
              },
            },
            propriedade: {
              columns: {
                nome: true,
              },
            },
          },
        });

        if (bufaloData) {
          const grupoNome = bufaloData.grupo?.nomeGrupo || 'Não informado';
          const propriedadeNome = bufaloData.propriedade?.nome || 'Não informada';

          await this.alertasService.createIfNotExists({
            animal_id: bufaloData.idBufalo,
            grupo: grupoNome,
            localizacao: propriedadeNome,
            id_propriedade: bufaloData.idPropriedade,
            motivo: `⚠️ ATENÇÃO: ${bufaloData.nome} diagnosticado(a) com ${doencaNormalizada}.`,
            nicho: NichoAlerta.CLINICO,
            data_alerta: new Date().toISOString().split('T')[0],
            prioridade: PrioridadeAlerta.ALTA,
            observacao: `Doença grave detectada: ${doencaNormalizada}. Monitorar evolução clínica e isolamento se necessário.`,
            id_evento_origem: data.idSanit,
            tipo_evento_origem: 'DADOS_SANITARIOS_GRAVE',
          });

          this.logger.log('Alerta clínico criado', {
            module: 'DadosSanitariosService',
            method: 'create',
            bufalo: bufaloData.nome,
            doenca: doencaNormalizada,
          });
        }
      }
    } catch (alertaError) {
      // Não bloqueia o fluxo se o alerta falhar
      this.logger.error('Erro ao criar alerta clínico', getErrorMessage(alertaError), { module: 'DadosSanitariosService', method: 'create' });
    }

    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findAll(limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findByBufalo(id_bufalo, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}, userId: string): Promise<PaginatedResponse<any>> {
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);

    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findByPropriedade(id_propriedade, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findOne(id_sanit: string) {
    const data = await this.repository.findById(id_sanit);

    if (!data) {
      throw new NotFoundException(`Dado sanitário com ID ${id_sanit} não encontrado.`);
    }

    return formatDateFields(data);
  }

  async update(id_sanit: string, dto: UpdateDadosSanitariosDto) {
    await this.findOne(id_sanit);

    // Validar medicação se estiver sendo atualizada
    if (dto.idMedicao) {
      const medicacao = await this.repository.findMedicacaoById(dto.idMedicao);

      if (!medicacao) {
        throw new BadRequestException(`Medicação com ID ${dto.idMedicao} não encontrada.`);
      }
    }

    // Normalizar a doença se estiver sendo atualizada
    const doencaNormalizada = dto.doenca ? this.normalizeDoenca(dto.doenca) : undefined;

    const data = await this.repository.update(id_sanit, dto, doencaNormalizada);

    return formatDateFields(data);
  }

  async remove(id_sanit: string) {
    return this.softDelete(id_sanit);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const data = await this.repository.softDelete(id);

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const registro = await this.repository.findByIdIncludingDeleted(id);

    if (!registro) {
      throw new NotFoundException(`Dado sanitário com ID ${id} não encontrado`);
    }

    if (!registro.deletedAt) {
      throw new BadRequestException('Este registro não está removido');
    }

    const data = await this.repository.restore(id);

    return {
      message: 'Registro restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const data = await this.repository.findAllWithDeleted();
    return formatDateFieldsArray(data);
  }

  /**
   * Retorna a frequência de doenças registradas na propriedade
   * @param id_propriedade ID da propriedade
   * @param agruparSimilares Se true, agrupa doenças com nomes similares (ex: erros de digitação)
   * @param limiarSimilaridade Limiar de similaridade para agrupamento (0-1, padrão 0.8)
   */
  async getFrequenciaDoencas(
    id_propriedade: string,
    agruparSimilares = false,
    limiarSimilaridade = 0.8,
    userId: string,
  ): Promise<FrequenciaDoencasResponseDto> {
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);

    // Buscar dados do repository
    const frequenciaData = await this.repository.findFrequenciaDoencas(id_propriedade);
    const totalRegistros = await this.repository.countTotalRegistros(id_propriedade);

    if (frequenciaData.length === 0) {
      return {
        dados: [],
        total_registros: 0,
        total_doencas_distintas: 0,
      };
    }

    // Se não agrupar similares, retorna direto
    if (!agruparSimilares) {
      return {
        dados: frequenciaData.map((item) => ({
          doenca: item.doenca,
          frequencia: Number(item.frequencia),
        })),
        total_registros: Number(totalRegistros),
        total_doencas_distintas: frequenciaData.length,
      };
    }

    // Agrupar doenças similares usando algoritmo de Levenshtein
    const doencasUnicas = frequenciaData.map((item) => item.doenca);
    const grupos = StringSimilarityUtil.groupSimilarStrings(doencasUnicas, limiarSimilaridade);

    const frequenciaMap = new Map<string, number>();

    frequenciaData.forEach((item) => {
      const doenca = item.doenca;
      const freq = Number(item.frequencia);

      // Encontra o grupo desta doença (usa o primeiro elemento do grupo como chave)
      const grupoKey = Array.from(grupos.keys()).find((key) => grupos.get(key)!.includes(doenca));

      const chave = grupoKey || doenca;
      const count = frequenciaMap.get(chave) || 0;
      frequenciaMap.set(chave, count + freq);
    });

    // Converte o Map para array e ordena por frequência (decrescente)
    const doencasOrdenadas = Array.from(frequenciaMap.entries())
      .map(([doenca, frequencia]) => ({ doenca, frequencia }))
      .sort((a, b) => b.frequencia - a.frequencia);

    return {
      dados: doencasOrdenadas,
      total_registros: Number(totalRegistros),
      total_doencas_distintas: doencasOrdenadas.length,
    };
  }

  /**
   * Retorna sugestões de nomes de doenças para autocomplete
   * @param termo Termo de busca (opcional)
   * @param limit Número máximo de sugestões
   */
  async getSugestoesDoencas(termo?: string, limit = 5): Promise<string[]> {
    return DoencaNormalizerUtil.getSugestoes(termo || '', limit);
  }

  /**
   * [MIGRAÇÃO] Normaliza todas as doenças existentes no banco
   * Execute este método UMA VEZ após implementar a normalização
   *
   * @returns Estatísticas da migração com detalhes das atualizações
   */
  async migrarNormalizacaoDoencas() {
    // 1. Busca todos os registros com doença
    const registros = await this.repository.findAllWithDeleted();
    const registrosComDoenca = registros.filter((r) => r.doenca);

    if (registrosComDoenca.length === 0) {
      return {
        message: 'Nenhum registro encontrado para normalizar',
        total: 0,
        atualizados: 0,
      };
    }

    // 2. Normaliza cada doença e atualiza
    const updates: { id: string; de: string; para: string }[] = [];
    const erros: { id: string; doenca_original: string; erro: string }[] = [];

    for (const registro of registrosComDoenca) {
      const doencaNormalizada = this.normalizeDoenca(registro.doenca || undefined);

      // Só atualiza se a doença mudou
      if (doencaNormalizada && doencaNormalizada !== registro.doenca) {
        try {
          await this.repository.update(
            registro.idSanit,
            {
              doenca: doencaNormalizada,
            },
            doencaNormalizada,
          );

          updates.push({
            id: registro.idSanit,
            de: registro.doenca || '',
            para: doencaNormalizada,
          });
        } catch (error) {
          erros.push({
            id: registro.idSanit,
            doenca_original: registro.doenca || '',
            erro: getErrorMessage(error),
          });
        }
      }
    }

    return {
      message: 'Migração concluída',
      total: registrosComDoenca.length,
      atualizados: updates.length,
      sem_alteracao: registrosComDoenca.length - updates.length - erros.length,
      detalhes: updates,
      erros: erros.length > 0 ? erros : undefined,
    };
  }
}
