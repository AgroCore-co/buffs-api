import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { EncontrarMachosCompativeisDto } from './dto/encontrar-machos-compativeis.dto';
import { firstValueFrom } from 'rxjs';

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
 * - URL base da IA: process.env.IA_API_URL
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
  private readonly logger = new Logger(SimulacaoService.name);
  private readonly iaApiUrl = process.env.IA_API_URL;

  constructor(
    private readonly bufaloService: BufaloService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Valida configuração ao inicializar o módulo
   */
  onModuleInit() {
    if (!this.iaApiUrl) {
      this.logger.error('❌ IA_API_URL não configurada no ambiente');
      throw new Error('IA_API_URL é obrigatória para o módulo de simulação');
    }
    this.logger.log(`✅ Módulo Simulação inicializado - IA URL: ${this.iaApiUrl}`);
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
   * @throws {InternalServerErrorException} Se API de IA estiver indisponível
   */
  async preverPotencial(dto: SimularAcasalamentoDto, user: any) {
    const { idMacho, idFemea } = dto;

    // Valida existência dos animais (lança exceção se não encontrar)
    await Promise.all([this.bufaloService.findOne(idMacho, user), this.bufaloService.findOne(idFemea, user)]);

    try {
      this.logger.debug(`Simulando acasalamento: Macho ${idMacho} x Fêmea ${idFemea}`);

      const payloadParaIA = {
        idMacho,
        idFemea,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/simular-acasalamento`, payloadParaIA, {
          params: { incluir_predicao_femea: true },
          timeout: 30000,
        }),
      );

      this.logger.log(`✅ Simulação concluída - Consanguinidade: ${response.data.consanguinidadeProle}%`);
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
   * @throws {InternalServerErrorException} Se API de IA estiver indisponível
   */
  async encontrarMachosCompativeis(dto: EncontrarMachosCompativeisDto, user: any) {
    const { idFemea, maxConsanguinidade } = dto;

    // Valida existência da fêmea
    await this.bufaloService.findOne(idFemea, user);

    try {
      this.logger.debug(`Buscando machos compatíveis - Fêmea: ${idFemea}, Max: ${maxConsanguinidade}%`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.iaApiUrl}/machos-compatíveis/${idFemea}`, {
          params: { max_consanguinidade: maxConsanguinidade },
          timeout: 20000,
        }),
      );

      this.logger.log(`✅ ${response.data.totalEncontrados} machos compatíveis encontrados`);
      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'buscar machos compatíveis');
    }
  }

  /**
   * Tratamento centralizado de erros da API de IA
   * @private
   */
  private handleIAError(error: any, operation: string): never {
    const errorDetails = error.response?.data || {};
    const status = error.response?.status;
    const message = errorDetails.detail || error.message;

    this.logger.error(`❌ Erro ao ${operation}:`, {
      status,
      message,
      url: error.config?.url,
    });

    // Lança erro com mensagem apropriada baseada no status
    if (status === 404) {
      throw new InternalServerErrorException(`Recurso não encontrado na IA ao ${operation}`);
    } else if (status === 400) {
      throw new InternalServerErrorException(`Dados inválidos ao ${operation}: ${message}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new InternalServerErrorException('Serviço de IA indisponível. Verifique se está rodando.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new InternalServerErrorException(`Timeout ao ${operation}. A operação demorou muito.`);
    }

    throw new InternalServerErrorException(`Erro ao ${operation}. Tente novamente mais tarde.`);
  }
}
