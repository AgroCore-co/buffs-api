import { CanActivate, ExecutionContext, Injectable, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import request = require('supertest');

import { LoggerService } from '../../../core/logger/logger.service';
import { SupabaseAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { DataIngestionController } from './data-ingestion.controller';
import { DataIngestionMapper } from '../mappers/data-ingestion.mapper';
import { DataIngestionService } from '../services/data-ingestion.service';

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { email: 'export-validation@example.com', cargo: 'ADMIN' };
    return true;
  }
}

@Injectable()
class TestRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('DataIngestionController - Export Validation', () => {
  let app: INestApplication;

  const serviceMock = {
    exportLeite: jest.fn(),
    exportPesagem: jest.fn(),
    exportReproducao: jest.fn(),
  } as unknown as jest.Mocked<Pick<DataIngestionService, 'exportLeite' | 'exportPesagem' | 'exportReproducao'>>;

  const loggerMock = {
    logApiRequest: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    logError: jest.fn(),
  };

  const propriedadeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [DataIngestionController],
      providers: [DataIngestionMapper, { provide: DataIngestionService, useValue: serviceMock }, { provide: LoggerService, useValue: loggerMock }],
    });

    moduleBuilder.overrideGuard(SupabaseAuthGuard).useClass(TestAuthGuard);
    moduleBuilder.overrideGuard(RolesGuard).useClass(TestRolesGuard);

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    serviceMock.exportLeite.mockResolvedValue({
      buffer: Buffer.from('fake-xlsx'),
      filename: 'leite_teste.xlsx',
    });

    serviceMock.exportPesagem.mockResolvedValue({
      buffer: Buffer.from('fake-xlsx'),
      filename: 'pesagem_teste.xlsx',
    });

    serviceMock.exportReproducao.mockResolvedValue({
      buffer: Buffer.from('fake-xlsx'),
      filename: 'reproducao_teste.xlsx',
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve retornar 400 quando grupoId for inválido no export de leite', async () => {
    await request(app.getHttpServer()).get(`/propriedades/${propriedadeId}/data-ingestion/leite/export`).query({ grupoId: 'invalido' }).expect(400);

    expect(serviceMock.exportLeite).not.toHaveBeenCalled();
  });

  it('deve retornar 400 quando houver query param não permitido', async () => {
    await request(app.getHttpServer()).get(`/propriedades/${propriedadeId}/data-ingestion/pesagem/export`).query({ foo: 'bar' }).expect(400);

    expect(serviceMock.exportPesagem).not.toHaveBeenCalled();
  });

  it('deve aceitar query válida e chamar o service com filtros normalizados', async () => {
    const grupoId = '3f27f7be-7f13-4d8e-b8e3-7c6f5156ed26';

    await request(app.getHttpServer())
      .get(`/propriedades/${propriedadeId}/data-ingestion/reproducao/export`)
      .query({
        grupoId,
        tipo: 'IA',
        de: '2026-01-01',
        ate: '2026-01-31',
      })
      .expect(200);

    expect(serviceMock.exportReproducao).toHaveBeenCalledWith(
      propriedadeId,
      expect.objectContaining({ email: 'export-validation@example.com' }),
      expect.objectContaining({
        propriedadeId,
        grupoId,
        tipo: 'IA',
        de: '2026-01-01',
        ate: '2026-01-31',
      }),
    );
  });
});
