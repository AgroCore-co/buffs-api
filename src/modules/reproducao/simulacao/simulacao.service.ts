import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { EncontrarMachosCompativeisDto } from './dto/encontrar-machos-compativeis.dto';
import { firstValueFrom } from 'rxjs';
import { GenealogiaRepositoryDrizzle } from '../genealogia/repositories';
import { GenealogiaService } from '../genealogia/genealogia.service';

/**
 * Serviço de simulação e análise de acasalamentos usando IA.
 *
 * Este serviço integra com uma API externa de Inteligência Artificial para:
 * - Prever potencial genético de acasalamentos
 * - Encontrar machos compatíveis para uma fêmea
 * - Analisar genealogia e calcular coeficiente de consanguinidade
 * - Fornecer recomendações baseadas em dados genéticos
 *
 * **Integração Externa:**
 * - URL base da IA: ConfigService (IA_API_URL)
 * - Timeout: 60 segundos (análise genealógica)
 * - Retry automático configurado no HttpService
 *
 * **Funcionalidades:**
 * 1. **Simular Acasalamento**: Previne cruzamentos problemáticos
 * 2. **Machos Compatíveis**: Busca reprodutores com baixa consanguinidade
 * 3. **Análise Genealógica**: Calcula índices de consanguinidade
 *
 * **Dependências:**
 * - {@link BufaloService}: Valida existência e acesso aos animais
 * - HttpService: Comunicação com API de IA
 *
 * @class SimulacaoService
 * @see {@link https://docs.exemplo.com/ia-api} Documentação da API de IA
 */
@Injectable()
export class SimulacaoService implements OnModuleInit {
  private readonly module = 'SimulacaoService';
  private readonly iaApiUrl: string;
  private readonly iaInternalKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly genealogiaRepo: GenealogiaRepositoryDrizzle,
    private readonly genealogiaService: GenealogiaService,
  ) {
    this.iaApiUrl = this.configService.get<string>('IA_API_URL') || '';
    this.iaInternalKey = this.configService.getOrThrow<string>('IA_INTERNAL_KEY');
  }

  /**
   * Valida configuração ao inicializar o módulo
   */
  onModuleInit() {
    if (!this.iaApiUrl?.trim()) {
      this.logger.error('IA_API_URL não configurada no ambiente', undefined, {
        module: this.module,
        method: 'onModuleInit',
      });
      throw new Error('IA_API_URL é obrigatória para o módulo de simulação');
    }
    this.logger.log(`Módulo de simulação inicializado. IA URL: ${this.iaApiUrl}`, {
      module: this.module,
      method: 'onModuleInit',
    });
  }

  /**
   * Simula acasalamento entre macho e fêmea usando IA.
   *
   * Previne potencial genético da cria, incluindo:
   * - Peso ao nascer estimado
   * - Produção de leite esperada (fêmeas)
   * - Qualidade genética geral
   * - Alertas de consanguinidade
   *
   * **Fluxo:**
   * 1. Valida existência dos animais
   * 2. Monta payload com IDs para API de IA
   * 3. Envia requisição incluindo predição de fêmea
   * 4. Retorna dados processados pela IA
   *
   * @param dto - IDs do macho e fêmea para simulação
   * @param user - Usuário autenticado (valida acesso aos animais)
   * @returns Predição genética do acasalamento
   * @throws {NotFoundException} Se macho ou fêmea não existir
   * @throws {ServiceUnavailableException} Se API de IA estiver indisponível
   */
  async preverPotencial(dto: SimularAcasalamentoDto, user: any) {
    const { idMacho, idFemea } = dto;

    await this.genealogiaService.buildTree(idMacho, 1, user);
    await this.genealogiaService.buildTree(idFemea, 1, user);

    try {
      this.logger.debug(`Simulando acasalamento: Macho ${idMacho} x Fêmea ${idFemea}`, {
        module: this.module,
        method: 'preverPotencial',
      });

      const payloadParaIA = {
        idMacho,
        idFemea,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/simular-acasalamento`, payloadParaIA, {
          params: { incluir_predicao_femea: true },
          headers: this.buildIAHeaders(user?.sub || user?.id || ''),
          timeout: 30000,
        }),
      );

      this.logger.log(`Simulação concluída com consanguinidade estimada: ${response.data.consanguinidadeProle}%`, {
        module: this.module,
        method: 'preverPotencial',
        idMacho,
        idFemea,
      });
      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'simular acasalamento');
    }
  }

  /**
   * Busca machos compatíveis para uma fêmea usando IA.
   *
   * Considera:
   * - Consanguinidade máxima aceitável (padrão: 6.25%)
   * - Compatibilidade genética
   * - Diversidade de raça
   * - Histórico reprodutivo
   *
   * **Parâmetros:**
   * - max_consanguinidade: Percentual máximo aceitável
   *   - 0% = sem parentesco
   *   - 6.25% = primos de segundo grau
   *   - 12.5% = primos de primeiro grau
   *   - 25% = irmãos ou pai/filha
   *
   * @param dto - ID da fêmea e consanguinidade máxima
   * @param user - Usuário autenticado
   * @returns Lista de machos compatíveis ordenados por score
   * @throws {NotFoundException} Se fêmea não existir
   * @throws {ServiceUnavailableException} Se API de IA estiver indisponível
   */
  async encontrarMachosCompativeis(dto: EncontrarMachosCompativeisDto, user: any) {
    const { idFemea, maxConsanguinidade } = dto;

    await this.genealogiaService.buildTree(idFemea, 1, user);

    try {
      this.logger.debug(`Buscando machos compatíveis - Fêmea: ${idFemea}, Max: ${maxConsanguinidade}%`, {
        module: this.module,
        method: 'encontrarMachosCompativeis',
      });

      const response = await firstValueFrom(
        this.httpService.get(`${this.iaApiUrl}/machos-compativeis/${idFemea}`, {
          params: { max_consanguinidade: maxConsanguinidade },
          headers: this.buildIAHeaders(user?.sub || user?.id || ''),
          timeout: 20000,
        }),
      );

      const iaData = response.data;

      // Enriquecer: buscar nomes no banco em uma única query
      const ids = (iaData.machosCompativeis ?? []).map((m: any) => m.idBufalo).filter(Boolean);
      const nomesMap = await this.genealogiaRepo.findBufalosByIds(ids);

      const machosEnriquecidos = (iaData.machosCompativeis ?? []).map((m: any) => ({
        idBufalo: m.idBufalo,
        nome: nomesMap.get(m.idBufalo) ?? 'Sem nome',
        consanguinidadeEstimada: m.consanguinidadeProle,
        riscoGenetico: (m.riscoConsanguinidade as string).toUpperCase(),
        scoreCompatibilidade: Math.max(0, Math.round((100 - m.consanguinidadeProle * 10) * 100) / 100),
      }));

      this.logger.log(`${machosEnriquecidos.length} machos compatíveis encontrados`, {
        module: this.module,
        method: 'encontrarMachosCompativeis',
        idFemea,
      });
      return {
        femeaId: iaData.femeaId,
        machosCompativeis: machosEnriquecidos,
        totalEncontrados: machosEnriquecidos.length,
        limiteConsanguinidade: iaData.limiteConsanguinidade,
      };
    } catch (error) {
      return this.handleIAError(error, 'buscar machos compatíveis');
    }
  }

  private buildIAHeaders(userId: string): Record<string, string> {
    return {
      'x-user-id': userId,
      'x-internal-key': this.iaInternalKey,
    };
  }

  /**
   * Tratamento centralizado de erros da API de IA
   * @private
   */
  private handleIAError(error: any, operation: string): never {
    const method = 'handleIAError';
    const errorDetails = error.response?.data || {};
    const status = error.response?.status;
    const message = errorDetails.detail || error.message;

    this.logger.error(`Erro ao ${operation}: ${message}`, undefined, {
      module: this.module,
      method,
      status,
      url: error.config?.url,
    });

    // Mapeia erros para respostas amigáveis ao frontend
    if (status === 404) {
      throw new NotFoundException(`Recurso não encontrado na IA ao ${operation}: ${message}`);
    }

    if (status === 400) {
      throw new BadRequestException({
        message: `Dados inválidos ao ${operation}: ${message}`,
        statusCode: 400,
        operation,
        iaDetail: errorDetails,
      });
    }

    if (status === 422) {
      throw new UnprocessableEntityException({
        message: `Não foi possível concluir ${operation}: ${message}`,
        statusCode: 422,
        operation,
        iaDetail: errorDetails,
      });
    }

    if (status && status >= 400 && status <= 599) {
      throw new HttpException(`Erro na IA ao ${operation}: ${message}`, status);
    }

    if (error.code === 'ECONNREFUSED') {
      throw new ServiceUnavailableException('Serviço de IA indisponível. Verifique se está rodando.');
    }

    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new RequestTimeoutException(`Timeout ao ${operation}. A operação demorou muito.`);
    }

    throw new ServiceUnavailableException(`Erro ao ${operation}. Tente novamente mais tarde.`);
  }
}
