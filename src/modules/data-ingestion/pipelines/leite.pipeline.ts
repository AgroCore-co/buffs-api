import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { IEtlClient, EtlImportResult, ETL_CLIENT, MulterFile } from '../interfaces';
import { DataIngestionValidator } from '../validators/data-ingestion.validator';
import { DataIngestionMapper } from '../mappers/data-ingestion.mapper';
import { ExportFiltersDto } from '../dto';
import { getErrorMessage } from '../../../core/utils/error.utils';

/**
 * Pipeline de ingestão de dados de produção de leite.
 *
 * Colunas esperadas na planilha: Brinco, Qtd. Produzida (L)
 */
@Injectable()
export class LeitePipeline {
  constructor(
    @Inject(ETL_CLIENT) private readonly etlClient: IEtlClient,
    private readonly validator: DataIngestionValidator,
    private readonly mapper: DataIngestionMapper,
    private readonly logger: LoggerService,
  ) {}

  async import(propriedadeId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    this.logger.log('Iniciando pipeline de importação de leite', {
      module: 'LeitePipeline',
      method: 'import',
      propriedadeId,
      userId,
       
      fileName: file.originalname,
    });

    this.validator.validateFile(file);
    await this.validator.validatePropriedadeAccess(userId, propriedadeId);
    await this.validator.checkRateLimit(propriedadeId);

    try {
      const result = await this.etlClient.importLeite(propriedadeId, userId, file);

      this.logger.log('Pipeline de importação de leite concluída', {
        module: 'LeitePipeline',
        method: 'import',
        propriedadeId,
        totalRows: result.totalRows,
        imported: result.imported,
        skipped: result.skipped,
        errorsCount: result.errors?.length ?? 0,
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.logError(error instanceof Error ? error : new Error(getErrorMessage(error)), {
        module: 'LeitePipeline',
        method: 'import',
        propriedadeId,
      });

      throw new HttpException(
        { code: 'ETL_UNAVAILABLE', message: 'Serviço de processamento indisponível. Tente novamente mais tarde.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async export(filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    this.logger.log('Iniciando pipeline de exportação de leite', {
      module: 'LeitePipeline',
      method: 'export',
      propriedadeId: filters.propriedadeId,
    });

    try {
      const buffer = await this.etlClient.exportLeite(filters);
      const filename = this.mapper.buildExportFileName('leite', filters.propriedadeId);

      this.logger.log('Pipeline de exportação de leite concluída', {
        module: 'LeitePipeline',
        method: 'export',
        propriedadeId: filters.propriedadeId,
        fileSize: buffer.length,
      });

      return { buffer, filename };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.logError(error instanceof Error ? error : new Error(getErrorMessage(error)), {
        module: 'LeitePipeline',
        method: 'export',
        propriedadeId: filters.propriedadeId,
      });

      throw new HttpException(
        { code: 'ETL_UNAVAILABLE', message: 'Serviço de processamento indisponível. Tente novamente mais tarde.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
