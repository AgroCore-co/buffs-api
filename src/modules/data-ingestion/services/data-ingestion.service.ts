import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';

import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { IEtlClient, EtlImportResult, EtlJobStatus, ETL_CLIENT, MulterFile } from '../interfaces';
import { ExportFiltersDto } from '../dto';
import { LeitePipeline } from '../pipelines/leite.pipeline';
import { PesagemPipeline } from '../pipelines/pesagem.pipeline';
import { ReproducaoPipeline } from '../pipelines/reproducao.pipeline';
import { getErrorMessage } from '../../../core/utils/error.utils';

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

    await this.leitePipeline.validator.validatePropriedadeAccess(userId, propriedadeId);
    return this.leitePipeline.export(filters);
  }

  async exportPesagem(propriedadeId: string, user: { email?: string }, filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de exportação de pesagem recebida', {
      module: 'DataIngestionService',
      method: 'exportPesagem',
      propriedadeId,
      userId,
    });

    await this.pesagemPipeline.validator.validatePropriedadeAccess(userId, propriedadeId);
    return this.pesagemPipeline.export(filters);
  }

  async exportReproducao(propriedadeId: string, user: { email?: string }, filters: ExportFiltersDto): Promise<{ buffer: Buffer; filename: string }> {
    const userId = await this.authHelper.getUserId(user);

    this.logger.log('Solicitação de exportação de reprodução recebida', {
      module: 'DataIngestionService',
      method: 'exportReproducao',
      propriedadeId,
      userId,
    });

    await this.reproducaoPipeline.validator.validatePropriedadeAccess(userId, propriedadeId);
    return this.reproducaoPipeline.export(filters);
  }

  // ── Job Status ───────────────────────────────────────────

  async getJobStatus(jobId: string): Promise<EtlJobStatus> {
    this.logger.log('Consultando status de job', {
      module: 'DataIngestionService',
      method: 'getJobStatus',
      jobId,
    });

    try {
      return await this.etlClient.getJobStatus(jobId);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.logError(error instanceof Error ? error : new Error(getErrorMessage(error)), {
        module: 'DataIngestionService',
        method: 'getJobStatus',
        jobId,
      });

      throw new HttpException(
        { code: 'ETL_UNAVAILABLE', message: 'Serviço de processamento indisponível. Tente novamente mais tarde.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
