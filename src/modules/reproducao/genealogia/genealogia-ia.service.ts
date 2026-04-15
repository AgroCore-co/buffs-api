import { HttpException, Injectable, OnModuleInit, RequestTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { AnaliseGenealogicaDto, MachosCompativeisDto, MachoCompativelDto } from './dto';
import { GenealogiaRepositoryDrizzle } from './repositories';
import { LoggerService } from '../../../core/logger/logger.service';

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
  private readonly module = 'GenealogiaIAService';
  private readonly iaApiUrl: string;
  private readonly requestTimeout: number = 30000; // 30 segundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly genealogiaRepo: GenealogiaRepositoryDrizzle,
  ) {
    // Mantém valor vindo do ambiente, mas garante um padrão alinhado ao env.example
    this.iaApiUrl = this.configService.get<string>('IA_API_URL') || 'http://localhost:5001';
  }

  onModuleInit() {
    this.logger.log(`GenealogiaIAService inicializado com URL: ${this.iaApiUrl}`, {
      module: this.module,
      method: 'onModuleInit',
    });
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

    this.logger.log(`Solicitando análise genealógica para búfalo ${idBufalo}`, {
      module: this.module,
      method: 'analisarGenealogiaCompleta',
      idBufalo,
    });

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

      this.logger.log('Análise genealógica concluída com sucesso', {
        module: this.module,
        method: 'analisarGenealogiaCompleta',
        idBufalo,
        consanguinidade: response.data.consanguinidade,
        risco: response.data.riscoGenetico,
      });

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
    const url = `${this.iaApiUrl}/machos-compativeis/${femeaId}`;

    this.logger.log(`Buscando machos compatíveis para fêmea ${femeaId} (max consanguinidade: ${maxConsanguinidade}%)`, {
      module: this.module,
      method: 'encontrarMachosCompativeis',
      femeaId,
    });

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

      const iaData = response.data;

      // Enriquecer: buscar nomes no banco em uma única query
      const ids = (iaData.machosCompativeis ?? []).map((m: any) => m.idBufalo).filter(Boolean);
      const nomesMap = await this.genealogiaRepo.findBufalosByIds(ids);

      const machosEnriquecidos: MachoCompativelDto[] = (iaData.machosCompativeis ?? []).map((m: any) => ({
        idBufalo: m.idBufalo,
        nome: nomesMap.get(m.idBufalo) ?? 'Sem nome',
        consanguinidadeEstimada: m.consanguinidadeProle,
        riscoGenetico: (m.riscoConsanguinidade as string).toUpperCase(),
        scoreCompatibilidade: Math.max(0, Math.round((100 - m.consanguinidadeProle * 10) * 100) / 100),
      }));

      this.logger.log(`Encontrados ${machosEnriquecidos.length} machos compatíveis para fêmea ${femeaId}`, {
        module: this.module,
        method: 'encontrarMachosCompativeis',
        femeaId,
      });

      return {
        femeaId: iaData.femeaId,
        machosCompativeis: machosEnriquecidos,
        totalEncontrados: machosEnriquecidos.length,
        limiteConsanguinidade: iaData.limiteConsanguinidade,
      };
    } catch (error) {
      return this.handleIAError(error, 'busca de machos compatíveis');
    }
  }

  /**
   * Tratamento centralizado de erros da IA
   */
  private handleIAError(error: any, operacao: string): never {
    const method = 'handleIAError';

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'Erro desconhecido';

      this.logger.error(`Erro na ${operacao} - Status ${status}: ${message}`, undefined, {
        module: this.module,
        method,
        status,
        iaData: error.response.data,
      });

      const safeStatus = status >= 400 && status <= 599 ? status : 502;
      throw new HttpException(`Erro na IA (${operacao}): ${message}`, safeStatus);
    }

    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`IA indisponível para ${operacao} em ${this.iaApiUrl}`, undefined, {
        module: this.module,
        method,
      });
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }

    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      this.logger.error(`Timeout na ${operacao} após ${this.requestTimeout}ms`, undefined, {
        module: this.module,
        method,
      });
      throw new RequestTimeoutException(`Timeout na ${operacao}. Tente novamente.`);
    }

    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(`Erro inesperado na ${operacao}: ${err.message}`, err.stack, {
      module: this.module,
      method,
    });
    throw new ServiceUnavailableException(`Erro inesperado na ${operacao}`);
  }
}
