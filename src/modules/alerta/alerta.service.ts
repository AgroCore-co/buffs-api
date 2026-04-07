import { Injectable, Inject, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GeminiService } from 'src/core/gemini/gemini.service';
import { CreateAlertaDto, PrioridadeAlerta } from './dto/create-alerta.dto';
import { PaginationDto } from '../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../core/utils/date-formatter.utils';
import { AlertaRepositoryDrizzle } from './repositories/alerta.repository.drizzle';
import { RABBITMQ_SERVICE, RabbitMQPatterns } from 'src/core/rabbitmq/rabbitmq.constants';
import { AlertaCriadoPayload } from './interfaces/alerta-criado-payload.interface';
import { getErrorMessage } from 'src/core/utils/error.utils';

interface AlertaFilter {
  nicho?: string;
  visto?: boolean;
  dataInicio?: string;
  dataFim?: string;
  limit: number;
  offset: number;
}

interface AlertaPropriedadeFilter {
  idPropriedade: string;
  visto?: boolean;
  nichos?: string[];
  prioridade?: string;
  limit: number;
  offset: number;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVIÇO DE ALERTAS - GESTÃO E PERSISTÊNCIA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Serviço responsável pela criação, leitura, atualização e exclusão de alertas
 * no sistema de gestão de rebanho bufalino.
 *
 * **Principais responsabilidades:**
 * -  Criar alertas no banco de dados (com ou sem verificação de duplicatas)
 * -  Listar alertas com filtros avançados e paginação
 * -  Gerenciar status de visualização dos alertas
 * -  Remover alertas do sistema
 *
 * **Método mais importante: createIfNotExists()**
 * - Implementa lógica de idempotência para schedulers
 * - Evita alertas duplicados não vistos
 * - Permite alertas recorrentes quando necessário
 * - Base do sistema de verificação automática
 *
 * **Tipos de alerta (Nichos):**
 * - CLINICO: Problemas de saúde graves
 * - SANITARIO: Tratamentos e vacinações
 * - REPRODUCAO: Gestação, coberturas, fêmeas vazias
 * - MANEJO: Secagem de búfalas
 * - PRODUCAO: Alertas de produção de leite
 *
 * **Prioridades:**
 * - ALTA: Requer ação imediata
 * - MEDIA: Requer atenção breve
 * - BAIXA: Observação de rotina
 *
 * @class AlertasService
 * @see AlertasScheduler - Scheduler que usa este serviço para criar alertas
 * @see AlertasController - Controller que expõe os endpoints REST
 */
@Injectable()
export class AlertasService {
  private readonly logger = new Logger(AlertasService.name);

  constructor(
    private readonly alertaRepo: AlertaRepositoryDrizzle,
    private readonly geminiService: GeminiService,
    @Inject(RABBITMQ_SERVICE) private readonly rmqClient: ClientProxy,
  ) {}

  /**
   * Cria um novo alerta no banco de dados.
   * Se prioridade NÃO estiver definida, usa IA do Gemini para classificar
   * automaticamente baseado no motivo + observacao do alerta.
   *
   * @param createAlertaDto - Os dados para a criação do novo alerta.
   * @returns O objeto do alerta recém-criado.
   */
  async create(createAlertaDto: CreateAlertaDto) {
    try {
      // Remove texto_ocorrencia_clinica antes de inserir (campo não existe no banco)
      const { texto_ocorrencia_clinica, ...alertaParaInserir } = createAlertaDto;

      const { data, error } = await this.alertaRepo.create(alertaParaInserir);

      if (error || !data) {
        console.error('Erro ao criar alerta:', getErrorMessage(error));
        throw new InternalServerErrorException(`Falha ao criar o alerta: ${getErrorMessage(error)}`);
      }

      // Publica evento no RabbitMQ — o consumer cuida de notificação + IA
      try {
        const payload: AlertaCriadoPayload = {
          id_alerta: data.idAlerta,
          nicho: data.nicho,
          prioridade: data.prioridade,
          titulo: data.motivo ?? 'Alerta',
          descricao: data.observacao,
          texto_ocorrencia_clinica: texto_ocorrencia_clinica ?? undefined,
          data_ocorrencia: data.dataAlerta,
          animal_id: data.animalId,
          id_propriedade: data.idPropriedade,
          grupo: data.grupo,
        };

        this.rmqClient.emit(RabbitMQPatterns.ALERTA_CRIADO, payload).subscribe({
          error: (err: unknown) => this.logger.warn(`RabbitMQ indisponível. Alerta ${data.idAlerta} salvo apenas no banco: ${getErrorMessage(err)}`),
        });
      } catch {
        this.logger.warn(`RabbitMQ indisponível. Alerta ${data.idAlerta} salvo apenas no banco.`);
      }

      return formatDateFields(data, ['data_alerta']);
    } catch (error: unknown) {
      throw error instanceof InternalServerErrorException ? error : new InternalServerErrorException('Ocorreu um erro inesperado ao criar o alerta.');
    }
  }

  /**
   * Cria um alerta apenas se não existir um alerta duplicado com a mesma origem de evento.
   * Este método implementa lógica de idempotência para evitar alertas duplicados nos schedulers.
   *
   * **Lógica de Idempotência (4 cenários):**
   *
   * 1. **Alerta não existe:**
   *    -  Cria novo alerta normalmente
   *
   * 2. **Alerta existe e NÃO foi visto:**
   *    -  NÃO cria duplicata
   *    -  Retorna o alerta existente
   *    - Motivo: Usuário ainda não verificou o alerta anterior
   *
   * 3. **Alerta existe, FOI visto, é do tipo recorrente:**
   *    - Verifica se já existe alerta NÃO VISTO para a MESMA DATA
   *    - Se existe:  Não cria (evita duplicatas no mesmo dia)
   *    - Se não existe: Cria novo alerta (situação persiste)
   *    - Tipos recorrentes: FEMEA_VAZIA, COBERTURA_SEM_DIAGNOSTICO
   *
   * 4. **Alerta existe, FOI visto, NÃO é recorrente:**
   *    -  Cria novo alerta
   *    - Motivo: Pode ser uma nova ocorrência do mesmo evento
   *
   * **Identificação de Alerta Único:**
   * - tipo_evento_origem (ex: 'FEMEA_VAZIA', 'NASCIMENTO_PREVISTO')
   * - id_evento_origem (ex: ID da cobertura, ID do búfalo)
   * - animal_id (ID do animal relacionado)
   * - nicho (CLINICO, SANITARIO, REPRODUCAO, MANEJO)
   *
   * **Exemplos de Uso:**
   *
   * ```typescript
   * // Exemplo 1: Fêmea vazia (recorrente)
   * // Dia 1: Cria alerta (fêmea vazia há 180 dias)
   * await createIfNotExists({
   *   tipo_evento_origem: 'FEMEA_VAZIA',
   *   id_evento_origem: 'bufala-123',
   *   animal_id: 'bufala-123',
   *   nicho: 'REPRODUCAO',
   *   data_alerta: '2025-11-12'
   * });
   * // Resultado: Alerta criado
   *
   * // Dia 2: Scheduler roda novamente (ainda não foi visto)
   * // Resultado: Não cria, retorna alerta do dia 1
   *
   * // Dia 3: Usuário marca como visto
   * await setVisto('alerta-id', true);
   *
   * // Dia 4: Scheduler roda novamente (fêmea continua vazia)
   * // Resultado:  Cria novo alerta (situação persiste)
   *
   * // Exemplo 2: Nascimento previsto (não recorrente)
   * await createIfNotExists({
   *   tipo_evento_origem: 'NASCIMENTO_PREVISTO',
   *   id_evento_origem: 'cobertura-456',
   *   animal_id: 'bufala-789',
   *   nicho: 'REPRODUCAO',
   *   data_alerta: '2025-12-01'
   * });
   * // Resultado: Sempre cria se não existe não visto
   * ```
   *
   * **Comportamento nos Schedulers:**
   * - Executam diariamente (CRON)
   * - Buscam eventos que requerem atenção
   * - Chamam createIfNotExists() para cada evento
   * - Sistema garante: 1 evento = 1 alerta não visto por vez
   *
   * @param createAlertaDto - Dados do alerta a ser criado
   * @returns O alerta criado ou o alerta existente (se não foi visto)
   * @throws InternalServerErrorException - Se houver erro ao verificar ou criar alerta
   *
   * @see create - Para criação sem verificação de duplicatas
   * @see AlertasScheduler - Onde este método é utilizado
   */
  async createIfNotExists(createAlertaDto: CreateAlertaDto) {
    try {
      // Verifica se já existe um alerta com os mesmos critérios
      if (createAlertaDto.tipo_evento_origem && createAlertaDto.id_evento_origem) {
        // Busca todos os alertas existentes (pode haver duplicatas)
        const { data: existingAlerts, error: searchError } = await this.alertaRepo.findExisting(
          createAlertaDto.tipo_evento_origem,
          createAlertaDto.id_evento_origem,
          createAlertaDto.animal_id,
          createAlertaDto.nicho,
        );

        if (searchError) {
          console.error('Erro ao verificar alerta existente:', getErrorMessage(searchError));
          throw new InternalServerErrorException(`Erro ao verificar alerta existente: ${getErrorMessage(searchError)}`);
        }

        // Se existem alertas, pega o mais recente
        if (existingAlerts && existingAlerts.length > 0) {
          const existingAlert = existingAlerts[0]; // Mais recente

          // Se o alerta JÁ EXISTE e NÃO foi visto, não cria duplicata
          if (!existingAlert.visto) {
            // console.log(`Alerta para evento ${createAlertaDto.tipo_evento_origem}:${createAlertaDto.id_evento_origem} já existe e não foi visto. Ignorando.`);
            return existingAlert;
          }

          // Se o alerta existe mas foi visto, verifica se precisa criar um novo
          // baseado na data do alerta (para alertas recorrentes como fêmeas vazias)
          if (existingAlert.visto) {
            // Para tipos recorrentes (FEMEA_VAZIA, COBERTURA_SEM_DIAGNOSTICO),
            // verifica se já existe um alerta NÃO VISTO na mesma data
            if (createAlertaDto.tipo_evento_origem === 'FEMEA_VAZIA' || createAlertaDto.tipo_evento_origem === 'COBERTURA_SEM_DIAGNOSTICO') {
              // data_alerta é sempre string no DTO (IsDateString)
              const dataAlerta = createAlertaDto.data_alerta.split('T')[0];
              const { data: alertaMesmaData } = await this.alertaRepo.findRecorrenteSameDate(
                createAlertaDto.tipo_evento_origem,
                createAlertaDto.id_evento_origem,
                createAlertaDto.animal_id,
                dataAlerta,
              );

              if (alertaMesmaData) {
                // console.log(`Alerta recorrente já existe para hoje e não foi visto. Ignorando.`);
                return alertaMesmaData;
              }
            }
          }
        }
      }

      // Se não existe, cria um novo alerta
      return await this.create(createAlertaDto);
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Erro inesperado ao criar alerta condicional:', error);
      throw new InternalServerErrorException('Ocorreu um erro inesperado ao verificar/criar o alerta.');
    }
  }

  /**
   * Retorna uma lista paginada de alertas com base nos filtros fornecidos.
   *
   * **Filtros disponíveis:**
   * - **tipo (nicho):** Filtra por tipo de alerta (CLINICO, SANITARIO, REPRODUCAO, MANEJO, PRODUCAO)
   * - **antecedencia:** Busca alertas nos próximos X dias a partir de hoje
   * - **incluirVistos:** Inclui ou exclui alertas já visualizados pelo usuário
   *
   * **Ordenação:**
   * - Primeiro por data_alerta (ascendente - mais próximos primeiro)
   * - Depois por prioridade (descendente - ALTA > MEDIA > BAIXA)
   *
   * **Exemplo de uso:**
   * ```typescript
   * // Buscar alertas SANITARIOS não vistos nos próximos 7 dias
   * await findAll('SANITARIO', 7, false, { page: 1, limit: 20 });
   *
   * // Buscar todos os alertas incluindo vistos
   * await findAll(undefined, undefined, true, { page: 1, limit: 10 });
   * ```
   *
   * @param tipo - Filtra os alertas por nicho (ex: 'CLINICO', 'REPRODUCAO')
   * @param antecendencia - Filtra alertas que ocorrerão nos próximos X dias a partir de hoje
   * @param incluirVistos - Se `true`, inclui alertas já marcados como vistos (padrão: false)
   * @param paginationDto - Parâmetros de paginação (page e limit)
   * @returns Resposta paginada contendo os alertas e metadados de paginação
   * @throws InternalServerErrorException - Se houver erro ao buscar ou contar alertas
   */
  async findAll(tipo?: string, antecendencia?: number, incluirVistos = false, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      // Preparar filtros
      const filters: AlertaFilter = {
        limit: limitValue,
        offset,
      };

      if (tipo) {
        filters.nicho = tipo;
      }

      if (!incluirVistos) {
        filters.visto = false;
      }

      if (antecendencia) {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() + Number(antecendencia));

        filters.dataInicio = hoje.toISOString().split('T')[0];
        filters.dataFim = dataLimite.toISOString().split('T')[0];
      }

      // Contar total
      const { count, error: countError } = await this.alertaRepo.countAll(filters);
      if (countError) {
        throw new InternalServerErrorException(`Falha ao contar alertas: ${getErrorMessage(countError)}`);
      }

      // Buscar dados com paginação
      const { data, error } = await this.alertaRepo.findAll(filters);

      if (error) {
        throw new InternalServerErrorException(`Falha ao buscar os alertas: ${getErrorMessage(error)}`);
      }

      const formattedData = formatDateFieldsArray(data, ['data_alerta']);
      return createPaginatedResponse(formattedData, count || 0, page, limitValue);
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Retorna alertas paginados de uma propriedade específica com filtros avançados.
   *
   * **Este método é usado pelo frontend para:**
   * - Listar alertas existentes de uma propriedade
   * - Filtrar por nichos específicos (ex: apenas alertas de REPRODUCAO)
   * - Filtrar por prioridade (ex: apenas alertas de ALTA prioridade)
   * - Controlar visualização (incluir/excluir alertas já vistos)
   *
   * **Diferença entre findByPropriedade vs Verificador (POST /verificar):**
   * - `findByPropriedade`: Apenas LISTA alertas já existentes no banco
   * - `POST /verificar`: PROCESSA dados atuais e CRIA novos alertas se necessário
   *
   * **Fluxo típico no frontend:**
   * ```typescript
   * // 1. Usuário acessa dashboard da propriedade
   * const alertas = await GET('/alertas/propriedade/123?incluirVistos=false');
   *
   * // 2. Usuário clica em "Verificar Novos Alertas"
   * await POST('/alertas/verificar/123?nichos=REPRODUCAO&nichos=SANITARIO');
   *
   * // 3. Recarrega lista para mostrar alertas criados
   * const alertasAtualizados = await GET('/alertas/propriedade/123?incluirVistos=false');
   * ```
   *
   * **Ordenação:**
   * - Primeiro por data_alerta (ascendente - mais urgentes primeiro)
   * - Depois por prioridade (descendente - ALTA > MEDIA > BAIXA)
   *
   * **Exemplo de uso:**
   * ```typescript
   * // Buscar apenas alertas de REPRODUCAO com ALTA prioridade não vistos
   * await findByPropriedade(
   *   'prop-123',
   *   false, // incluirVistos
   *   { page: 1, limit: 20 },
   *   ['REPRODUCAO'], // nichos
   *   'ALTA' // prioridade
   * );
   * ```
   *
   * @param id_propriedade - UUID da propriedade
   * @param incluirVistos - Se `true`, inclui alertas já marcados como vistos (padrão: false)
   * @param paginationDto - Parâmetros de paginação (page e limit)
   * @param nichos - Array opcional de nichos para filtrar (ex: ['CLINICO', 'SANITARIO'])
   * @param prioridade - Prioridade opcional para filtrar ('BAIXA', 'MEDIA', 'ALTA')
   * @returns Resposta paginada contendo os alertas da propriedade
   * @throws InternalServerErrorException - Se houver erro ao buscar ou contar alertas
   */
  async findByPropriedade(
    id_propriedade: string,
    incluirVistos = false,
    paginationDto: PaginationDto = {},
    nichos?: string[],
    prioridade?: string,
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      // Preparar filtros
      const filters: AlertaPropriedadeFilter = {
        idPropriedade: id_propriedade,
        limit: limitValue,
        offset,
      };

      if (!incluirVistos) {
        filters.visto = false;
      }

      if (nichos && nichos.length > 0) {
        filters.nichos = nichos;
      }

      if (prioridade) {
        filters.prioridade = prioridade;
      }

      // Contar total
      const { count, error: countError } = await this.alertaRepo.countByPropriedade(filters);
      if (countError) {
        throw new InternalServerErrorException(`Falha ao contar alertas da propriedade: ${getErrorMessage(countError)}`);
      }

      // Buscar dados com paginação
      const { data, error } = await this.alertaRepo.findByPropriedade(filters);

      if (error) {
        throw new InternalServerErrorException(`Falha ao buscar alertas da propriedade: ${getErrorMessage(error)}`);
      }

      const formattedData = formatDateFieldsArray(data, ['data_alerta']);
      return createPaginatedResponse(formattedData, count || 0, page, limitValue);
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Encontra um alerta específico pela sua chave primária (id_alerta).
   * @param id - O ID UUID do alerta.
   * @returns O objeto do alerta correspondente.
   */
  async findOne(id: string) {
    const { data, error } = await this.alertaRepo.findOne(id);

    if (error) {
      // Erro específico para quando o registro não é encontrado
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'PGRST116') {
        throw new NotFoundException(`Alerta com ID ${id} não encontrado.`);
      }
      throw new InternalServerErrorException(getErrorMessage(error));
    }
    return formatDateFields(data!, ['data_alerta']);
  }

  /**
   * Atualiza o status de visualização de um alerta específico.
   *
   * **Funcionalidade:**
   * - Marca alertas como vistos/não vistos para controle do usuário
   * - Atualiza automaticamente o campo `updated_at` com timestamp atual
   * - Valida existência do alerta antes de atualizar
   *
   * **Importante para alertas recorrentes:**
   * - Quando um alerta recorrente (FEMEA_VAZIA, COBERTURA_SEM_DIAGNOSTICO) é marcado como visto,
   *   o scheduler pode criar um NOVO alerta no dia seguinte se a situação persistir
   * - Isso permite ao usuário "resolver" temporariamente um alerta sem perder o rastreamento
   *
   * **Exemplo de uso no frontend:**
   * ```typescript
   * // Usuário visualiza detalhes do alerta
   * await PATCH('/alertas/123/visto?status=true');
   *
   * // Usuário quer marcar como não visto novamente
   * await PATCH('/alertas/123/visto?status=false');
   * ```
   *
   * @param id - UUID do alerta a ser atualizado
   * @param visto - Novo status de visualização (true = visto, false = não visto)
   * @returns Objeto do alerta com status atualizado
   * @throws NotFoundException - Se o alerta não for encontrado
   * @throws InternalServerErrorException - Se houver erro ao atualizar
   */
  async setVisto(id: string, visto: boolean) {
    // Garante que o alerta existe antes de atualizar
    await this.findOne(id);

    const { data, error } = await this.alertaRepo.update(id, { visto });

    if (error) {
      // Pode acontecer se o item for deletado entre a verificação e a atualização
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'PGRST116') {
        throw new NotFoundException(`Alerta com ID ${id} não encontrado para atualização.`);
      }
      throw new InternalServerErrorException(`Falha ao atualizar o status do alerta: ${getErrorMessage(error)}`);
    }
    return formatDateFields(data!, ['data_alerta']);
  }

  async atualizarPrioridade(id: string, prioridade: PrioridadeAlerta | string) {
    await this.findOne(id);

    const { data, error } = await this.alertaRepo.atualizarPrioridade(id, prioridade);

    if (error) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'PGRST116') {
        throw new NotFoundException(`Alerta com ID ${id} não encontrado para atualização.`);
      }

      throw new InternalServerErrorException(`Falha ao atualizar prioridade do alerta: ${getErrorMessage(error)}`);
    }

    return formatDateFields(data!, ['data_alerta']);
  }

  /**
   * Remove um alerta do banco de dados.
   * @param id - O ID UUID do alerta a ser removido.
   */
  async remove(id: string) {
    // Garante que o alerta existe antes de deletar
    await this.findOne(id);

    const { error } = await this.alertaRepo.remove(id);

    if (error) {
      throw new InternalServerErrorException(`Falha ao remover o alerta: ${getErrorMessage(error)}`);
    }
    // Retorno void para um status 204 No Content no controller
    return;
  }
}
