import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SyncPaginationDto } from './dto';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let syncService: jest.Mocked<SyncService>;

  const idPropriedade = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const user = { email: 'sync@example.com' };
  const query: SyncPaginationDto = { page: 1, limit: 200 };

  beforeEach(() => {
    syncService = {
      syncBufalos: jest.fn(),
      syncLactacao: jest.fn(),
      syncGrupos: jest.fn(),
      syncRacas: jest.fn(),
      syncDadosZootecnicos: jest.fn(),
      syncMedicamentos: jest.fn(),
      syncDadosSanitarios: jest.fn(),
      syncAlertas: jest.fn(),
      syncCoberturas: jest.fn(),
      syncMaterialGenetico: jest.fn(),
      syncDashboardLactacao: jest.fn(),
      syncDashboardProducaoMensal: jest.fn(),
      syncDashboardReproducao: jest.fn(),
      syncDashboard: jest.fn(),
    } as unknown as jest.Mocked<SyncService>;

    controller = new SyncController(syncService);
  });

  it('deve delegar rota de bufalos para o service', async () => {
    syncService.syncBufalos.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 200,
        total: 0,
        updated_at: '2026-04-08T10:00:00.000Z',
        synced_at: '2026-04-08T10:00:00.000Z',
      },
    });

    const response = await controller.syncBufalos(idPropriedade, user, query);

    expect(syncService.syncBufalos).toHaveBeenCalledWith(idPropriedade, user, query);
    expect(response.meta.limit).toBe(200);
  });

  it('deve delegar rota de dashboard para o service', async () => {
    syncService.syncDashboard.mockResolvedValue({
      data: [{ id: `dashboard-stats-${idPropriedade}` }],
      meta: {
        page: 1,
        limit: 200,
        total: 1,
        updated_at: '2026-04-08T10:00:00.000Z',
        synced_at: '2026-04-08T10:00:00.000Z',
      },
    });

    const response = await controller.syncDashboard(idPropriedade, user, query);

    expect(syncService.syncDashboard).toHaveBeenCalledWith(idPropriedade, user, query);
    expect(response.data).toHaveLength(1);
  });
});
