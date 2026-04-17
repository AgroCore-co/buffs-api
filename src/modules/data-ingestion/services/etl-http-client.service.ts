import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

import { LoggerService } from '../../../core/logger/logger.service';
import { IEtlClient, EtlImportResult, EtlJobStatus, MulterFile } from '../interfaces';
import { ExportFiltersDto } from '../dto';

@Injectable()
export class EtlHttpClient implements IEtlClient {
  private readonly baseUrl: string;
  private readonly internalKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('ETL_BASE_URL');
    this.internalKey = this.configService.getOrThrow<string>('ETL_INTERNAL_KEY');
  }

  async importLeite(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    return this.sendImport(`/import/leite`, propertyId, userId, file);
  }

  async importPesagem(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    return this.sendImport(`/import/pesagem`, propertyId, userId, file);
  }

  async importReproducao(propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    return this.sendImport(`/import/reproducao`, propertyId, userId, file);
  }

  async exportLeite(filters: ExportFiltersDto): Promise<Buffer> {
    return this.sendExport(`/export/leite`, filters);
  }

  async exportPesagem(filters: ExportFiltersDto): Promise<Buffer> {
    return this.sendExport(`/export/pesagem`, filters);
  }

  async exportReproducao(filters: ExportFiltersDto): Promise<Buffer> {
    return this.sendExport(`/export/reproducao`, filters);
  }

  async getJobStatus(jobId: string, userId: string): Promise<EtlJobStatus> {
    this.logger.log(`Consultando status do job: ${jobId}`, {
      module: 'EtlHttpClient',
      method: 'getJobStatus',
      userId,
    });

    const response = await firstValueFrom(
      this.httpService.get<EtlJobStatus>(`${this.baseUrl}/jobs/${jobId}/status`, {
        headers: this.buildHeaders(),
        params: { usuarioId: userId },
      }),
    );

    return response.data;
  }

  private async sendImport(path: string, propertyId: string, userId: string, file: MulterFile): Promise<EtlImportResult> {
    this.logger.log(`Enviando import para ETL: ${path}`, {
      module: 'EtlHttpClient',
      method: 'sendImport',
      propertyId,
      originalName: file.originalname,
      size: file.size,
    });

    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await firstValueFrom(
      this.httpService.post<EtlImportResult>(`${this.baseUrl}${path}`, form, {
        headers: {
          ...this.buildHeaders(),
          ...form.getHeaders(),
        },
        params: { propriedadeId: propertyId, usuarioId: userId },
        timeout: 120_000,
      }),
    );

    this.logger.log(`Import ETL concluído: ${path}`, {
      module: 'EtlHttpClient',
      method: 'sendImport',
      propertyId,
      totalRows: response.data.totalRows,
      imported: response.data.imported,
      skipped: response.data.skipped,
      errorsCount: response.data.errors?.length ?? 0,
    });

    return response.data;
  }

  private async sendExport(path: string, filters: ExportFiltersDto): Promise<Buffer> {
    this.logger.log(`Enviando export para ETL: ${path}`, {
      module: 'EtlHttpClient',
      method: 'sendExport',
      propertyId: filters.propriedadeId,
    });

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}${path}`, {
        headers: this.buildHeaders(),
        params: this.buildExportParams(filters),
        responseType: 'arraybuffer',
        timeout: 60_000,
      }),
    );

    this.logger.log(`Export ETL concluído: ${path}`, {
      module: 'EtlHttpClient',
      method: 'sendExport',
      propertyId: filters.propriedadeId,
      size: response.data.length,
    });

    return Buffer.from(response.data);
  }

  private buildHeaders(): Record<string, string> {
    return {
      'X-Internal-Key': this.internalKey,
    };
  }

  private buildExportParams(filters: ExportFiltersDto): Record<string, string> {
    const params: Record<string, string> = {
      propriedadeId: filters.propriedadeId,
    };
    if (filters.grupoId) params.grupoId = filters.grupoId;
    if (filters.maturidade) params.maturidade = filters.maturidade;
    if (filters.sexo) params.sexo = filters.sexo;
    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.de) params.de = filters.de;
    if (filters.ate) params.ate = filters.ate;

    return params;
  }
}
