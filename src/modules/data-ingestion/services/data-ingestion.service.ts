import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { IEtlClient, EtlImportResult, EtlJobStatus, ETL_CLIENT, MulterFile } from '../interfaces';
import { ExportFiltersDto, ImportResponseDto, JobStatusResponseDto } from '../dto';
import { LeitePipeline } from '../pipelines/leite.pipeline';
import { PesagemPipeline } from '../pipelines/pesagem.pipeline';
import { ReproducaoPipeline } from '../pipelines/reproducao.pipeline';
import { getErrorMessage } from '../../../core/utils/error.utils';
import { isAxiosError } from 'axios';

@Injectable()
export class DataIngestionService {
  constructor(
    @Inject(ETL_CLIENT) private readonly etlClient: IEtlClient,
    private readonly leitePipeline: LeitePipeline,
    private readonly pesagemPipeline: PesagemPipeline,
    private readonly reproducaoPipeline: ReproducaoPipeline,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  // ── Import ───────────────────────────────────────────────

  async importLeite(propriedadeId: string, user: { email?: string }, file: MulterFile): Promise<EtlImportResult> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de importação de leite recebida', {
      module: 'DataIngestionService',
      method: 'importLeite',
      propriedadeId,
      userId,
    });

    return this.leitePipeline.import(propriedadeId, userId, file);
  }

  async importPesagem(propriedadeId: string, user: { email?: string }, file: MulterFile): Promise<EtlImportResult> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de importação de pesagem recebida', {
      module: 'DataIngestionService',
      method: 'importPesagem',
      propriedadeId,
      userId,
    });

    return this.pesagemPipeline.import(propriedadeId, userId, file);
  }

  async importReproducao(propriedadeId: string, user: { email?: string }, file: MulterFile): Promise<EtlImportResult> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de importação de reprodução recebida', {
      module: 'DataIngestionService',
      method: 'importReproducao',
      propriedadeId,
      userId,
    });

    return this.reproducaoPipeline.import(propriedadeId, userId, file);
  }

  // ── Export ───────────────────────────────────────────────

  async exportLeite(propriedadeId: string, user: { email?: string }, filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de exportação de leite recebida', {
      module: 'DataIngestionService',
      method: 'exportLeite',
      propriedadeId,
      userId,
    });

    return this.leitePipeline.export(userId, filters);
  }

  async exportPesagem(propriedadeId: string, user: { email?: string }, filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de exportação de pesagem recebida', {
      module: 'DataIngestionService',
      method: 'exportPesagem',
      propriedadeId,
      userId,
    });

    return this.pesagemPipeline.export(userId, filters);
  }

  async exportReproducao(propriedadeId: string, user: { email?: string }, filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de exportação de reprodução recebida', {
      module: 'DataIngestionService',
      method: 'exportReproducao',
      propriedadeId,
      userId,
    });

    return this.reproducaoPipeline.export(userId, filters);
  }

  // ── Job Status ───────────────────────────────────────────

  async getJobStatus(jobId: string, userId: string): Promise<JobStatusResponseDto> {
    this.logger.log('Consultando status de job', {
      module: 'DataIngestionService',
      method: 'getJobStatus',
      jobId,
      userId,
    });

    try {
      const etlStatus = await this.etlClient.getJobStatus(jobId, userId);
      const normalizedStatus = this.normalizeJobStatus(etlStatus.status);
      const result = this.mapImportResult(etlStatus.result);

      const createdAtRaw = etlStatus.createdAt ?? etlStatus.created_at;
      const updatedAtRaw = etlStatus.updatedAt ?? etlStatus.updated_at;

      const response = {
        jobId: etlStatus.jobId ?? etlStatus.job_id ?? jobId,
        status: normalizedStatus,
        progress: typeof etlStatus.progress === 'number' ? etlStatus.progress : normalizedStatus === 'done' || normalizedStatus === 'failed' ? 1 : 0,
        result,
        createdAt: createdAtRaw ? new Date(createdAtRaw) : new Date(),
        updatedAt: updatedAtRaw ? new Date(updatedAtRaw) : new Date(),
      } satisfies JobStatusResponseDto;

      return response;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const payload = error.response.data as { code?: string; message?: string } | undefined;

        if (status === HttpStatus.NOT_FOUND) {
          throw new HttpException(
            {
              code: payload?.code ?? 'JOB_NOT_FOUND',
              message: payload?.message ?? 'Job não encontrado. Ele pode ter expirado ou sido removido pela rotina de limpeza.',
            },
            HttpStatus.NOT_FOUND,
          );
        }

        if (status === HttpStatus.BAD_REQUEST || status === HttpStatus.FORBIDDEN || status === HttpStatus.UNAUTHORIZED) {
          throw new HttpException(
            {
              code: payload?.code ?? 'JOB_STATUS_ERROR',
              message: payload?.message ?? 'Falha ao consultar status do job no ETL.',
            },
            status,
          );
        }
      }

      this.logger.logError(error instanceof Error ? error : new Error(getErrorMessage(error)), {
        module: 'DataIngestionService',
        method: 'getJobStatus',
        jobId,
        userId,
      });

      throw new HttpException(
        { code: 'ETL_UNAVAILABLE', message: 'Serviço de processamento indisponível. Tente novamente mais tarde.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private normalizeJobStatus(status: string): 'pending' | 'processing' | 'done' | 'failed' {
    const normalized = status.toLowerCase();

    if (normalized === 'pending' || normalized === 'processing' || normalized === 'done' || normalized === 'failed') {
      return normalized;
    }

    return 'failed';
  }

  private mapImportResult(result: EtlJobStatus['result']): ImportResponseDto | undefined {
    if (!result) return undefined;

    const rawResult = result as {
      jobId?: string;
      job_id?: string;
      totalRows?: number;
      total_rows?: number;
      imported?: number;
      skipped?: number;
      errors?: ImportResponseDto['errors'];
      warnings?: ImportResponseDto['warnings'];
    };

    return {
      jobId: rawResult.jobId ?? rawResult.job_id,
      totalRows: rawResult.totalRows ?? rawResult.total_rows ?? 0,
      imported: rawResult.imported ?? 0,
      skipped: rawResult.skipped ?? 0,
      errors: rawResult.errors ?? [],
      warnings: rawResult.warnings ?? [],
    };
  }
}
