import { HttpException, HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { IEtlClient } from '../interfaces';
import { LeitePipeline } from '../pipelines/leite.pipeline';
import { PesagemPipeline } from '../pipelines/pesagem.pipeline';
import { ReproducaoPipeline } from '../pipelines/reproducao.pipeline';
import { DataIngestionService } from './data-ingestion.service';

describe('DataIngestionService - JobStatus Mapping', () => {
  let service: DataIngestionService;
  let etlClient: jest.Mocked<IEtlClient>;

  beforeEach(() => {
    etlClient = {
      importLeite: jest.fn(),
      importPesagem: jest.fn(),
      importReproducao: jest.fn(),
      exportLeite: jest.fn(),
      exportPesagem: jest.fn(),
      exportReproducao: jest.fn(),
      getJobStatus: jest.fn(),
    } as unknown as jest.Mocked<IEtlClient>;

    const leitePipeline = {
      import: jest.fn(),
      export: jest.fn(),
    } as unknown as LeitePipeline;

    const pesagemPipeline = {
      import: jest.fn(),
      export: jest.fn(),
    } as unknown as PesagemPipeline;

    const reproducaoPipeline = {
      import: jest.fn(),
      export: jest.fn(),
    } as unknown as ReproducaoPipeline;

    const authHelper = {
      getUserId: jest.fn(),
    } as unknown as AuthHelperService;

    const logger = {
      log: jest.fn(),
      logError: jest.fn(),
    } as unknown as LoggerService;

    service = new DataIngestionService(etlClient, leitePipeline, pesagemPipeline, reproducaoPipeline, authHelper, logger);
  });

  it('deve mapear payload snake_case do ETL para JobStatusResponseDto com Date real', async () => {
    etlClient.getJobStatus.mockResolvedValue({
      job_id: 'job_123',
      status: 'DONE',
      result: {
        total_rows: 12,
        imported: 10,
        skipped: 2,
        errors: [{ row: 2, field: 'brinco', value: 'A', message: 'inválido' }],
        warnings: [{ row: 3, field: 'peso', value: '0', message: 'baixo' }],
      },
      created_at: '2026-04-16T10:00:00.000Z',
      updated_at: '2026-04-16T10:05:00.000Z',
    });

    const response = await service.getJobStatus('job_123', 'user-1');

    expect(response).toMatchObject({
      jobId: 'job_123',
      status: 'done',
      progress: 1,
      result: {
        totalRows: 12,
        imported: 10,
        skipped: 2,
      },
    });

    expect(response.createdAt).toBeInstanceOf(Date);
    expect(response.updatedAt).toBeInstanceOf(Date);
    expect(response.createdAt.toISOString()).toBe('2026-04-16T10:00:00.000Z');
    expect(response.updatedAt.toISOString()).toBe('2026-04-16T10:05:00.000Z');
  });

  it('deve usar progress=0 quando status for processing e o ETL não enviar progresso', async () => {
    etlClient.getJobStatus.mockResolvedValue({
      jobId: 'job_456',
      status: 'PROCESSING',
      createdAt: '2026-04-16T11:00:00.000Z',
      updatedAt: '2026-04-16T11:01:00.000Z',
    });

    const response = await service.getJobStatus('job_456', 'user-1');

    expect(response.status).toBe('processing');
    expect(response.progress).toBe(0);
  });

  it('deve converter erro 404 do ETL para HttpException com JOB_NOT_FOUND', async () => {
    etlClient.getJobStatus.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: HttpStatus.NOT_FOUND,
        data: {
          code: 'JOB_NOT_FOUND',
          message: 'job expirado',
        },
      },
    });

    await expect(service.getJobStatus('job_404', 'user-1')).rejects.toBeInstanceOf(HttpException);

    try {
      await service.getJobStatus('job_404', 'user-1');
      throw new Error('era esperado HttpException');
    } catch (error) {
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toEqual({
        code: 'JOB_NOT_FOUND',
        message: 'job expirado',
      });
    }
  });
});
