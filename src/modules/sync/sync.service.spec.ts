import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuthHelperService } from '../../core/services/auth-helper.service';
import { SyncRepository } from './repositories/sync.repository';
import { SyncPaginationDto } from './dto';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let repository: jest.Mocked<SyncRepository>;
  let authHelper: jest.Mocked<AuthHelperService>;
  let dashboardService: jest.Mocked<DashboardService>;

  const user = { email: 'sync@example.com' };
  const idPropriedade = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  beforeEach(() => {
    repository = {
      listBufalosByPropriedade: jest.fn(),
      listLactacaoByPropriedade: jest.fn(),
      listGruposByPropriedade: jest.fn(),
      listRacas: jest.fn(),
      listDadosZootecnicosByPropriedade: jest.fn(),
      listMedicamentosByPropriedade: jest.fn(),
      listDadosSanitariosByPropriedade: jest.fn(),
      listAlertasByPropriedade: jest.fn(),
      listCoberturasByPropriedade: jest.fn(),
      listMaterialGeneticoByPropriedade: jest.fn(),
    } as unknown as jest.Mocked<SyncRepository>;

    authHelper = {
      getUserId: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    dashboardService = {
      getLactacaoMetricas: jest.fn(),
      getProducaoMensal: jest.fn(),
      getReproducaoMetricas: jest.fn(),
      getStats: jest.fn(),
    } as unknown as jest.Mocked<DashboardService>;

    service = new SyncService(repository, authHelper, dashboardService);

    authHelper.getUserId.mockResolvedValue('user-123');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('deve sincronizar bufalos com contrato padrao e aliases', async () => {
    repository.listBufalosByPropriedade.mockResolvedValue({
      data: [
        {
          idBufalo: 'buf-1',
          nome: 'Bufalo 1',
          updatedAt: '2026-04-08T09:00:00.000Z',
          deletedAt: null,
        },
      ],
      total: 1,
      updatedAt: '2026-04-08T09:00:00.000Z',
    });

    const query: SyncPaginationDto = { page: 1, limit: 200 };
    const response = await service.syncBufalos(idPropriedade, user, query);

    expect(authHelper.getUserId).toHaveBeenCalledWith(user);
    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-123', idPropriedade);
    expect(repository.listBufalosByPropriedade).toHaveBeenCalledWith(idPropriedade, 200, 0);

    expect(response.meta.page).toBe(1);
    expect(response.meta.limit).toBe(200);
    expect(response.meta.total).toBe(1);
    expect(response.meta.updated_at).toBe('2026-04-08T09:00:00.000Z');
    expect(response.meta.synced_at).toBeDefined();

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      id: 'buf-1',
      idBufalo: 'buf-1',
      updated_at: '2026-04-08T09:00:00.000Z',
      deleted_at: null,
    });
  });

  it('deve limitar paginação para 200 quando limit vier acima do maximo', async () => {
    repository.listBufalosByPropriedade.mockResolvedValue({
      data: [],
      total: 0,
      updatedAt: null,
    });

    const query: SyncPaginationDto = { page: 2, limit: 999 };
    const response = await service.syncBufalos(idPropriedade, user, query);

    expect(repository.listBufalosByPropriedade).toHaveBeenCalledWith(idPropriedade, 200, 200);
    expect(response.meta.page).toBe(2);
    expect(response.meta.limit).toBe(200);
    expect(response.meta.total).toBe(0);
    expect(response.meta.updated_at).toBe(response.meta.synced_at);
  });

  it('deve bloquear sync quando usuario nao tiver acesso a propriedade', async () => {
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.syncBufalos(idPropriedade, user, { page: 1, limit: 10 })).rejects.toThrow(NotFoundException);
    expect(repository.listBufalosByPropriedade).not.toHaveBeenCalled();
  });

  it('deve sincronizar dashboard com pacote unico e total igual a 1', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T10:00:00.000Z'));

    dashboardService.getStats.mockResolvedValue({
      qtd_macho_ativos: 1,
      qtd_femeas_ativas: 2,
      qtd_bufalos_registradas: 3,
      qtd_bufalos_bezerro: 0,
      qtd_bufalos_novilha: 1,
      qtd_bufalos_vaca: 1,
      qtd_bufalos_touro: 1,
      qtd_bufalas_lactando: 1,
      qtd_lotes: 1,
      qtd_usuarios: 1,
      bufalosPorRaca: [],
    });

    const response = await service.syncDashboard(idPropriedade, user, { page: 1, limit: 200 });

    expect(dashboardService.getStats).toHaveBeenCalledWith(idPropriedade);
    expect(response.meta).toEqual({
      page: 1,
      limit: 200,
      total: 1,
      updated_at: '2026-04-08T10:00:00.000Z',
      synced_at: '2026-04-08T10:00:00.000Z',
    });
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      id: `dashboard-stats-${idPropriedade}`,
      updated_at: '2026-04-08T10:00:00.000Z',
      deleted_at: null,
    });
  });

  it('deve usar ano atual ao sincronizar dashboard de lactacao', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T15:30:00.000Z'));

    dashboardService.getLactacaoMetricas.mockResolvedValue({
      ano: 2026,
      media_rebanho_ano: 0,
      ciclos: [],
    });

    await service.syncDashboardLactacao(idPropriedade, user, { page: 1, limit: 200 });

    expect(dashboardService.getLactacaoMetricas).toHaveBeenCalledWith(idPropriedade, 2026);
  });
});
