import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { AnaliseGenealogicaDto, MachosCompativeisDto } from '../dto';

/**
 * Service responsável pela integração com a IA para análises genealógicas.
 *
 * **Funcionalidades:**
 * - Análise de consanguinidade de búfalos
 * - Busca de machos compatíveis para acasalamento
 * - Análise de risco genético
 */
@Injectable()
export class GenealogiaIAService implements OnModuleInit {
  private readonly logger = new Logger(GenealogiaIAService.name);
  private readonly iaApiUrl: string;
  private readonly requestTimeout: number = 30000; // 30 segundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.iaApiUrl = this.configService.get<string>('IA_API_URL') || 'http://localhost:8000';
  }

  onModuleInit() {
    this.logger.log(`GenealogiaIAService inicializado com URL: ${this.iaApiUrl}`);
  }

  /**
   * Analisa a genealogia completa de um búfalo, incluindo cálculo de consanguinidade
   * e análise de risco genético.
   *
   * @param idBufalo ID do búfalo a ser analisado
   * @param userId ID do usuário (para autenticação na IA)
   * @returns Análise genealógica completa
   */
  async analisarGenealogiaCompleta(idBufalo: string, userId: string): Promise<AnaliseGenealogicaDto> {
    const url = `${this.iaApiUrl}/analise-genealogica`;

    this.logger.log(`Solicitando análise genealógica para búfalo ${idBufalo}`);

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<AnaliseGenealogicaDto>(
            url,
            { idBufalo },
            {
              headers: { 'x-user-id': userId },
              timeout: this.requestTimeout,
            },
          )
          .pipe(timeout(this.requestTimeout)),
      );

      this.logger.log(
        `Análise genealógica concluída - Búfalo: ${idBufalo}, ` +
          `Consanguinidade: ${response.data.consanguinidade}%, ` +
          `Risco: ${response.data.riscoGenetico}`,
      );

      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'análise genealógica');
    }
  }

  /**
   * Encontra machos compatíveis para acasalamento com uma fêmea,
   * baseado no limite de consanguinidade aceitável.
   *
   * @param femeaId ID da fêmea
   * @param maxConsanguinidade Consanguinidade máxima aceitável em % (padrão: 6.25%)
   * @param userId ID do usuário (para autenticação na IA)
   * @returns Lista de machos compatíveis
   */
  async encontrarMachosCompativeis(femeaId: string, maxConsanguinidade = 6.25, userId: string): Promise<MachosCompativeisDto> {
    const url = `${this.iaApiUrl}/machos-compatíveis/${femeaId}`;

    this.logger.log(`Buscando machos compatíveis para fêmea ${femeaId} ` + `(max consanguinidade: ${maxConsanguinidade}%)`);

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<MachosCompativeisDto>(url, {
            params: { max_consanguinidade: maxConsanguinidade },
            headers: { 'x-user-id': userId },
            timeout: this.requestTimeout,
          })
          .pipe(timeout(this.requestTimeout)),
      );

      this.logger.log(`Encontrados ${response.data.totalEncontrados} machos compatíveis ` + `para fêmea ${femeaId}`);

      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'busca de machos compatíveis');
    }
  }

  /**
   * Tratamento centralizado de erros da IA
   */
  private handleIAError(error: any, operacao: string): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'Erro desconhecido';

      this.logger.error(`Erro na ${operacao} - Status ${status}: ${message}`, error.response.data);

      throw new Error(`Erro na IA (${operacao}): ${message}`);
    }

    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`IA indisponível para ${operacao} em ${this.iaApiUrl}`);
      throw new Error('Serviço de IA temporariamente indisponível');
    }

    if (error.name === 'TimeoutError') {
      this.logger.error(`Timeout na ${operacao} após ${this.requestTimeout}ms`);
      throw new Error(`Timeout na ${operacao}. Tente novamente.`);
    }

    this.logger.error(`Erro inesperado na ${operacao}:`, error);
    throw new Error(`Erro inesperado na ${operacao}`);
  }
}
