import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { PredicaoProducaoResponseDto } from './dto';

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
  private readonly requestTimeout: number = 30000; // 30 segundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.iaApiUrl = this.configService.get<string>('IA_API_URL') || 'http://localhost:8000';
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

    this.logger.log(`Solicitando predição de produção para fêmea ${idFemea}`);

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<PredicaoProducaoResponseDto>(
            url,
            { idFemea },
            {
              headers: { 'x-user-id': userId },
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

      return response.data;
    } catch (error) {
      return this.handleIAError(error, 'predição de produção');
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
