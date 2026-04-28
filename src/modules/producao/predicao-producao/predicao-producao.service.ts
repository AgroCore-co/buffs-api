import { Injectable, Logger, OnModuleInit, HttpException, RequestTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { PredicaoProducaoResponseDto } from './dto';
import { CacheService } from '../../../core/cache/cache.service';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';

/**
 * Service responsável pela integração com a IA para predição de produção de leite.
 *
 * **Funcionalidades:**
 * - Predizer produção individual de fêmeas
 * - Classificar potencial produtivo
 * - Comparar com média da propriedade
 */
@Injectable()
export class PredicaoProducaoService implements OnModuleInit {
  private readonly logger = new Logger(PredicaoProducaoService.name);
  private readonly iaApiUrl: string;
  private readonly iaInternalKey: string;
  private readonly requestTimeout: number = 30000; // 30 segundos
  private readonly cacheTtlMs: number = 10 * 60 * 1000; // 10 minutos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly genealogiaService: GenealogiaService,
  ) {
    this.iaApiUrl = this.configService.get<string>('IA_API_URL') || 'http://localhost:8000';
    this.iaInternalKey = this.configService.getOrThrow<string>('IA_INTERNAL_KEY');
  }

  onModuleInit() {
    this.logger.log(`PredicaoProducaoService inicializado com URL: ${this.iaApiUrl}`);
  }

  /**
   * Prediz a produção de leite de uma fêmea para o próximo ciclo de lactação.
   *
   * @param idFemea ID da fêmea
   * @param userId ID do usuário (para autenticação na IA)
   * @returns Predição de produção com classificação e comparação
   */
  async predizerProducaoIndividual(idFemea: string, userId: string): Promise<PredicaoProducaoResponseDto> {
    const url = `${this.iaApiUrl}/predicao-individual`;
    const cacheKey = `predicao:producao:${userId}:${idFemea}`;

    await this.genealogiaService.buildTree(idFemea, 1, { sub: userId });

    this.logger.log(`Solicitando predição de produção para fêmea ${idFemea}`);

    const cached = await this.cacheService.get<PredicaoProducaoResponseDto>(cacheKey);
    if (cached) {
      this.logger.log(`Predição retornada do cache para fêmea ${idFemea}`);
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<PredicaoProducaoResponseDto>(
            url,
            { idFemea },
            {
              headers: this.buildIAHeaders(userId),
              timeout: this.requestTimeout,
            },
          )
          .pipe(timeout(this.requestTimeout)),
      );

      this.logger.log(
        `Predição concluída - Fêmea: ${idFemea}, ` +
          `Predição: ${response.data.predicaoLitros}L, ` +
          `Classificação: ${response.data.classificacaoPotencial}`,
      );

      await this.cacheService.set(cacheKey, response.data, this.cacheTtlMs);

      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'predição de produção');
    }
  }

  private buildIAHeaders(userId: string): Record<string, string> {
    return {
      'x-user-id': userId,
      'x-internal-key': this.iaInternalKey,
    };
  }

  /**
   * Tratamento centralizado de erros da IA
   */
  private handleIAError(error: any, operacao: string): never {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'Erro desconhecido';

      this.logger.error(`Erro na ${operacao} - Status ${status}: ${message}`, error.response.data);

      const safeStatus = status >= 400 && status <= 599 ? status : 502;
      throw new HttpException(`Erro na IA (${operacao}): ${message}`, safeStatus);
    }

    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`IA indisponível para ${operacao} em ${this.iaApiUrl}`);
      throw new ServiceUnavailableException('Serviço de IA temporariamente indisponível');
    }

    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      this.logger.error(`Timeout na ${operacao} após ${this.requestTimeout}ms`);
      throw new RequestTimeoutException(`Timeout na ${operacao}. Tente novamente.`);
    }

    this.logger.error(`Erro inesperado na ${operacao}:`, error);
    throw new ServiceUnavailableException(`Erro inesperado na ${operacao}`);
  }
}
