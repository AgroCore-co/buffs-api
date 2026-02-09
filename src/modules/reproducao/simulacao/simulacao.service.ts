import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { BufaloService } from '../../rebanho/bufalo/bufalo.service';
import { SimularAcasalamentoDto } from './dto/simular-acasalamento.dto';
import { EncontrarMachosCompativeisDto } from './dto/encontrar-machos-compativeis.dto';
import { firstValueFrom } from 'rxjs';
import { AnaliseGenealogicaDto } from './dto/analise-genealogica.dto';

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
export class SimulacaoService {
  private readonly iaApiUrl = process.env.IA_API_URL;

  constructor(
    private readonly bufaloService: BufaloService,
    private readonly httpService: HttpService,
  ) {}

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

    // 1. A validação dos animais continua perfeita.
    const macho = await this.bufaloService.findOne(idMacho, user);
    const femea = await this.bufaloService.findOne(idFemea, user);

    const payloadParaIA = {
      id_macho: macho.idBufalo,
      id_femea: femea.idBufalo,
    };

    // 2. A chamada para a API agora está correta e completa.
    try {
      console.log('Enviando para a IA:', JSON.stringify(payloadParaIA, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/simular-acasalamento`, payloadParaIA, { params: { incluir_predicao_femea: true } }),
      );

      console.log('Resposta da IA recebida com sucesso.');
      return response.data;
    } catch (error) {
      console.error('Erro ao chamar a API de IA:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de predição está indisponível no momento.');
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

    const femea = await this.bufaloService.findOne(idFemea, user);

    try {
      console.log(`Buscando machos compatíveis para fêmea ID: ${idFemea} com consanguinidade máxima: ${maxConsanguinidade}%`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.iaApiUrl}/machos-compatíveis/${idFemea}`, {
          params: {
            max_consanguinidade: maxConsanguinidade,
          },
        }),
      );

      console.log('Machos compatíveis encontrados com sucesso.');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar machos compatíveis:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de busca de machos compatíveis está indisponível no momento.');
    }
  }

  /**
   * Realiza análise genealógica completa de um búfalo usando IA.
   *
   * Calcula:
   * - Coeficiente de consanguinidade (inbreeding coefficient)
   * - Diversidade genética
   * - Análise de pedigree até 4 gerações
   * - Identificação de antepassados comuns
   *
   * **Timeout:**
   * 60 segundos devido à complexidade do cálculo genealógico.
   *
   * **Casos de Uso:**
   * - Validação de categoria ABCB
   * - Planejamento de acasalamentos
   * - Auditoria genética do rebanho
   *
   * @param dto - ID do búfalo para análise
   * @param user - Usuário autenticado
   * @returns Análise genealógica completa com índices calculados
   * @throws {NotFoundException} Se búfalo não existir
   * @throws {InternalServerErrorException} Se API de IA estiver indisponível ou timeout
   */
  async analiseGenealogica(dto: AnaliseGenealogicaDto, user: any) {
    const { idBufalo } = dto;

    const bufalo = await this.bufaloService.findOne(idBufalo, user);

    try {
      console.log('Realizando análise genealógica para a búfala: ' + bufalo.idBufalo);

      const response = await firstValueFrom(
        this.httpService.post(`${this.iaApiUrl}/analise-genealogica`, { id_bufalo: bufalo.idBufalo }, { timeout: 60000 }),
      );

      console.log('Análise genealógica feita com sucesso');

      return response.data;
    } catch (error) {
      console.error('Erro ao efetuar análise genealógica:', error.response?.data || error.code || error.message);
      throw new InternalServerErrorException('O serviço de análise genealógica está indisponível no momento.');
    }
  }
}
