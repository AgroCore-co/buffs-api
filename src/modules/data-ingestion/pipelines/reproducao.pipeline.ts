import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { IEtlClient, EtlImportResult, ETL_CLIENT, MulterFile } from '../interfaces';
import { DataIngestionValidator } from '../validators/data-ingestion.validator';
import { DataIngestionMapper } from '../mappers/data-ingestion.mapper';
import { ExportFiltersDto } from '../dto';
import { getErrorMessage } from '../../../core/utils/error.utils';

/**
 * Pipeline de ingestão de dados de reprodução.
 *
 * Colunas esperadas na planilha: Brinco Macho, Brinco Fêmea,
 * Tipo Inseminação, Cód. Material Genético (opcional)
 */
@Injectable()
export class ReproducaoPipeline {
  constructor(
    @Inject(ETL_CLIENT) private readonly etlClient: IEtlClient,
    private readonly validator: DataIngestionValidator,
    private readonly mapper: DataIngestionMapper,
    private readonly logger: LoggerService,
  ) {}

  async import(propriedadeId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    this.logger.log('Iniciando pipeline de importação de reprodução', {
      module: 'ReproducaoPipeline',
      method: 'import',
      propriedadeId,
      userId,
      fileName: file.originalname,
    });

    this.validator.validateFile(file);
    await this.validator.validatePropriedadeAccess(userId, propriedadeId);
    await this.validator.checkRateLimit(propriedadeId);

    try {
      const result = await this.etlClient.importReproducao(propriedadeId, file);

      this.logger.log('Pipeline de importação de reprodução concluída', {
        module: 'ReproducaoPipeline',
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
        module: 'ReproducaoPipeline',
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
    this.logger.log('Iniciando pipeline de exportação de reprodução', {
      module: 'ReproducaoPipeline',
      method: 'export',
      propriedadeId: filters.propriedadeId,
    });

    try {
      const buffer = await this.etlClient.exportReproducao(filters);
      const filename = this.mapper.buildExportFileName('reproducao', filters.propriedadeId);

      this.logger.log('Pipeline de exportação de reprodução concluída', {
        module: 'ReproducaoPipeline',
        method: 'export',
        propriedadeId: filters.propriedadeId,
        fileSize: buffer.length,
      });

      return { buffer, filename };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.logError(error instanceof Error ? error : new Error(getErrorMessage(error)), {
        module: 'ReproducaoPipeline',
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
