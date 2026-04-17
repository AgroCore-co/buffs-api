import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { MulterFile } from '../interfaces';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hora

@Injectable()
export class DataIngestionValidator {
  constructor(
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
    private readonly authHelper: AuthHelperService,
  ) {}

  /**
   * Valida se o arquivo enviado é um .xlsx válido e dentro do limite de tamanho.
   */
  validateFile(file: MulterFile): void {
    if (!file) {
      throw new HttpException({ code: 'INVALID_FILE_TYPE', message: 'Nenhum arquivo foi enviado.' }, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      this.logger.warn('Arquivo com tipo inválido recebido', {
        module: 'DataIngestionValidator',
        method: 'validateFile',
        mimetype: file.mimetype,
        originalName: file.originalname,
      });
      throw new HttpException(
        {
          code: 'INVALID_FILE_TYPE',
          message: `Tipo de arquivo não suportado: ${file.mimetype}. Apenas .xlsx é aceito.`,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      this.logger.warn('Arquivo excede tamanho máximo', {
        module: 'DataIngestionValidator',
        method: 'validateFile',
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      });
      throw new HttpException(
        {
          code: 'FILE_TOO_LARGE',
          message: `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  /**
   * Valida acesso do usuário à propriedade.
   * Lança 403 se o usuário não tem permissão.
   */
  async validatePropriedadeAccess(userId: string, propriedadeId: string): Promise<void> {
    const hasAccess = await this.authHelper.hasAccessToPropriedade(userId, propriedadeId);

    if (!hasAccess) {
      this.logger.warn('Acesso negado à propriedade para data-ingestion', {
        module: 'DataIngestionValidator',
        method: 'validatePropriedadeAccess',
        userId,
        propriedadeId,
      });
      throw new HttpException({ code: 'FORBIDDEN', message: 'Você não tem permissão para acessar esta propriedade.' }, HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Verifica rate limit de imports por propriedade (max 10/hora).
   * Usa Redis (via CacheService) para contagem.
   */
  async checkRateLimit(propriedadeId: string): Promise<void> {
    const cacheKey = `data-ingestion:rate:${propriedadeId}`;
    const newCount = await this.cacheService.increment(cacheKey, RATE_LIMIT_WINDOW_SECONDS);

    if (newCount > RATE_LIMIT_MAX) {
      this.logger.warn('Rate limit excedido para importação', {
        module: 'DataIngestionValidator',
        method: 'checkRateLimit',
        propriedadeId,
        current: newCount,
        max: RATE_LIMIT_MAX,
      });
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Limite de ${RATE_LIMIT_MAX} importações por hora atingido. Tente novamente mais tarde.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
