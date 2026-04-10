import { CanActivate, ExecutionContext, Injectable, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import request = require('supertest');
import { DatabaseService } from '../src/core/database/database.service';
import { PropertyExistsGuard } from '../src/core/guards/property-exists.guard';
import { AuthHelperService } from '../src/core/services/auth-helper.service';
import { SupabaseAuthGuard } from '../src/modules/auth/guards/auth.guard';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { SyncController } from '../src/modules/sync/sync.controller';
import { SyncRepository } from '../src/modules/sync/repositories/sync.repository';
import { SyncService } from '../src/modules/sync/sync.service';

@Injectable()
class TestSupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { email: 'sync@example.com' };
    return true;
  }
}

@Injectable()
class TestPropertyExistsGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

describe('Sync HTTP Integration (Issue #32)', () => {
  let app: INestApplication;

  type AsyncMockFn = (...args: unknown[]) => Promise<unknown>;

  const idPropriedade = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const fixedUpdatedAt = '2026-04-09T12:00:00.000Z';

  const syncRepositoryMock = {
    listBufalosByPropriedade: jest.fn<AsyncMockFn>(),
    listLactacaoByPropriedade: jest.fn<AsyncMockFn>(),
    listGruposByPropriedade: jest.fn<AsyncMockFn>(),
    listRacas: jest.fn<AsyncMockFn>(),
    listDadosZootecnicosByPropriedade: jest.fn<AsyncMockFn>(),
    listMedicamentosByPropriedade: jest.fn<AsyncMockFn>(),
    listDadosSanitariosByPropriedade: jest.fn<AsyncMockFn>(),
    listAlertasByPropriedade: jest.fn<AsyncMockFn>(),
    listCoberturasByPropriedade: jest.fn<AsyncMockFn>(),
    listMaterialGeneticoByPropriedade: jest.fn<AsyncMockFn>(),
  };

  const authHelperMock = {
    getUserId: jest.fn<AsyncMockFn>().mockResolvedValue('user-123'),
    validatePropriedadeAccess: jest.fn<AsyncMockFn>().mockResolvedValue(undefined),
  };

  const dashboardServiceMock = {
    getLactacaoMetricas: jest.fn<AsyncMockFn>(),
    getProducaoMensal: jest.fn<AsyncMockFn>(),
    getReproducaoMetricas: jest.fn<AsyncMockFn>(),
    getStats: jest.fn<AsyncMockFn>(),
  };

  const databaseServiceMock = {
    db: {
      query: {
        propriedade: {
          findFirst: jest.fn<AsyncMockFn>().mockResolvedValue({ idPropriedade: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        },
      },
    },
  };

  function setupRepositoryDefaults(): void {
    syncRepositoryMock.listBufalosByPropriedade.mockResolvedValue({
      data: [{ idBufalo: 'buf-1', nome: 'Bufalo Teste', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listLactacaoByPropriedade.mockResolvedValue({
      data: [{ idCicloLactacao: 'lac-1', status: 'Em Lactação', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listGruposByPropriedade.mockResolvedValue({
      data: [{ idGrupo: 'gru-1', nomeGrupo: 'Grupo A', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listRacas.mockResolvedValue({
      data: [{ idRaca: 'rac-1', nome: 'Murrah', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listDadosZootecnicosByPropriedade.mockResolvedValue({
      data: [{ idZootec: 'zoo-1', peso: '620.00', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listMedicamentosByPropriedade.mockResolvedValue({
      data: [{ idMedicacao: 'med-1', medicacao: 'Antibiotico', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listDadosSanitariosByPropriedade.mockResolvedValue({
      data: [{ idSanit: 'san-1', doenca: 'Mastite', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listAlertasByPropriedade.mockResolvedValue({
      data: [{ idAlerta: 'ale-1', prioridade: 'ALTA', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listCoberturasByPropriedade.mockResolvedValue({
      data: [{ idReproducao: 'cob-1', status: 'Confirmada', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });

    syncRepositoryMock.listMaterialGeneticoByPropriedade.mockResolvedValue({
      data: [{ idMaterial: 'mat-1', tipo: 'Semen', updatedAt: fixedUpdatedAt, deletedAt: null }],
      total: 1,
      updatedAt: fixedUpdatedAt,
    });
  }

  function setupDashboardDefaults(): void {
    dashboardServiceMock.getLactacaoMetricas.mockResolvedValue({
      ano: 2026,
      media_rebanho_ano: 1234.56,
      ciclos: [],
    });

    dashboardServiceMock.getProducaoMensal.mockResolvedValue({
      ano: 2026,
      mes_atual_litros: 100,
      mes_anterior_litros: 90,
      variacao_percentual: 11.11,
      bufalas_lactantes_atual: 2,
      serie_historica: [],
    });

    dashboardServiceMock.getReproducaoMetricas.mockResolvedValue({
      totalEmAndamento: 1,
      totalConfirmada: 2,
      totalFalha: 0,
      ultimaDataReproducao: '2026-04-01',
    });

    dashboardServiceMock.getStats.mockResolvedValue({
      qtd_macho_ativos: 10,
      qtd_femeas_ativas: 20,
      qtd_bufalos_registradas: 30,
      qtd_bufalos_bezerro: 2,
      qtd_bufalos_novilha: 3,
      qtd_bufalos_vaca: 20,
      qtd_bufalos_touro: 5,
      qtd_bufalas_lactando: 8,
      qtd_lotes: 4,
      qtd_usuarios: 2,
      bufalosPorRaca: [{ raca: 'Murrah', quantidade: 20 }],
    });
  }

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        SyncService,
        { provide: SyncRepository, useValue: syncRepositoryMock },
        { provide: AuthHelperService, useValue: authHelperMock },
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: DatabaseService, useValue: databaseServiceMock },
      ],
    });

    moduleBuilder.overrideGuard(SupabaseAuthGuard).useClass(TestSupabaseAuthGuard);
    moduleBuilder.overrideGuard(PropertyExistsGuard).useClass(TestPropertyExistsGuard);

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authHelperMock.getUserId.mockResolvedValue('user-123');
    authHelperMock.validatePropriedadeAccess.mockResolvedValue(undefined);
    setupRepositoryDefaults();
    setupDashboardDefaults();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const collectionCases = [
    {
      route: 'bufalos',
      expectedId: 'buf-1',
    },
    {
      route: 'lactacao',
      expectedId: 'lac-1',
    },
    {
      route: 'grupos',
      expectedId: 'gru-1',
    },
    {
      route: 'racas',
      expectedId: 'rac-1',
    },
    {
      route: 'dados-zootecnicos',
      expectedId: 'zoo-1',
    },
    {
      route: 'medicamentos',
      expectedId: 'med-1',
    },
    {
      route: 'dados-sanitarios',
      expectedId: 'san-1',
    },
    {
      route: 'alertas',
      expectedId: 'ale-1',
    },
    {
      route: 'coberturas',
      expectedId: 'cob-1',
    },
    {
      route: 'material-genetico',
      expectedId: 'mat-1',
    },
  ];

  it.each(collectionCases)('deve responder /sync/:id_propriedade/$route com payload de sync', async ({ route, expectedId }) => {
    const response = await request(app.getHttpServer()).get(`/sync/${idPropriedade}/${route}`).query({ page: 1, limit: 200 }).expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 200,
        total: 1,
        updated_at: fixedUpdatedAt,
        synced_at: expect.any(String),
      }),
    );

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: expectedId,
      updated_at: fixedUpdatedAt,
      deleted_at: null,
    });
  });

  it('deve responder dashboard/lactacao com pacote unico', async () => {
    const response = await request(app.getHttpServer()).get(`/sync/${idPropriedade}/dashboard/lactacao`).query({ page: 1, limit: 200 }).expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].id).toMatch(new RegExp(`^dashboard-lactacao-${idPropriedade}-\\d{4}$`));
    expect(response.body.data[0]).toHaveProperty('updated_at');
    expect(response.body.data[0]).toHaveProperty('deleted_at', null);
  });

  it('deve responder dashboard/producao-mensal com pacote unico', async () => {
    const response = await request(app.getHttpServer())
      .get(`/sync/${idPropriedade}/dashboard/producao-mensal`)
      .query({ page: 1, limit: 200 })
      .expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].id).toMatch(new RegExp(`^dashboard-producao-mensal-${idPropriedade}-\\d{4}$`));
    expect(response.body.data[0]).toHaveProperty('updated_at');
    expect(response.body.data[0]).toHaveProperty('deleted_at', null);
  });

  it('deve responder dashboard/reproducao com pacote unico', async () => {
    const response = await request(app.getHttpServer()).get(`/sync/${idPropriedade}/dashboard/reproducao`).query({ page: 1, limit: 200 }).expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].id).toBe(`dashboard-reproducao-${idPropriedade}`);
    expect(response.body.data[0]).toHaveProperty('updated_at');
    expect(response.body.data[0]).toHaveProperty('deleted_at', null);
  });

  it('deve responder dashboard com pacote unico', async () => {
    const response = await request(app.getHttpServer()).get(`/sync/${idPropriedade}/dashboard`).query({ page: 1, limit: 200 }).expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data[0].id).toBe(`dashboard-stats-${idPropriedade}`);
    expect(response.body.data[0]).toHaveProperty('updated_at');
    expect(response.body.data[0]).toHaveProperty('deleted_at', null);
  });

  it('deve retornar 400 quando limit excede 200', async () => {
    await request(app.getHttpServer()).get(`/sync/${idPropriedade}/bufalos`).query({ page: 2, limit: 999 }).expect(400);

    expect(syncRepositoryMock.listBufalosByPropriedade).not.toHaveBeenCalled();
  });

  it('deve retornar 400 para page invalida', async () => {
    await request(app.getHttpServer()).get(`/sync/${idPropriedade}/bufalos`).query({ page: 0, limit: 10 }).expect(400);
  });

  it('deve retornar 400 para updated_at invalido', async () => {
    await request(app.getHttpServer()).get(`/sync/${idPropriedade}/bufalos`).query({ updated_at: 'nao-e-iso' }).expect(400);
  });

  it('deve retornar 404 quando usuario nao tem acesso a propriedade', async () => {
    authHelperMock.validatePropriedadeAccess.mockRejectedValueOnce(new NotFoundException('Sem acesso'));

    await request(app.getHttpServer()).get(`/sync/${idPropriedade}/bufalos`).query({ page: 1, limit: 200 }).expect(404);
    expect(syncRepositoryMock.listBufalosByPropriedade).not.toHaveBeenCalled();
  });
});
