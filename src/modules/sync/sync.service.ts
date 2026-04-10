import { Injectable } from '@nestjs/common';
import { AuthHelperService } from '../../core/services/auth-helper.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { SyncPaginationDto, SyncResponse } from './dto';
import { SyncQueryResult, SyncRepository } from './repositories/sync.repository';

type SyncUser = {
  email?: string;
} & Record<string, unknown>;

interface PaginationInfo {
  page: number;
  limit: number;
  offset: number;
}

@Injectable()
export class SyncService {
  constructor(
    private readonly syncRepository: SyncRepository,
    private readonly authHelper: AuthHelperService,
    private readonly dashboardService: DashboardService,
  ) {}

  async syncBufalos(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listBufalosByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idBufalo');
  }

  async syncLactacao(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listLactacaoByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idCicloLactacao');
  }

  async syncGrupos(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listGruposByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idGrupo');
  }

  async syncRacas(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listRacas(pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idRaca');
  }

  async syncDadosZootecnicos(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listDadosZootecnicosByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idZootec');
  }

  async syncMedicamentos(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listMedicamentosByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idMedicacao');
  }

  async syncDadosSanitarios(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listDadosSanitariosByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idSanit');
  }

  async syncAlertas(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listAlertasByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idAlerta');
  }

  async syncCoberturas(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listCoberturasByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idReproducao');
  }

  async syncMaterialGenetico(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const result = await this.syncRepository.listMaterialGeneticoByPropriedade(id_propriedade, pagination.limit, pagination.offset);

    return this.buildCollectionResponse(result, pagination, 'idMaterial');
  }

  async syncDashboardLactacao(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const anoAtual = new Date().getFullYear();
    const dashboardData = await this.dashboardService.getLactacaoMetricas(id_propriedade, anoAtual);

    return this.buildDashboardResponse(this.toRecord(dashboardData), pagination, `dashboard-lactacao-${id_propriedade}-${anoAtual}`);
  }

  async syncDashboardProducaoMensal(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const anoAtual = new Date().getFullYear();
    const dashboardData = await this.dashboardService.getProducaoMensal(id_propriedade, anoAtual);

    return this.buildDashboardResponse(this.toRecord(dashboardData), pagination, `dashboard-producao-mensal-${id_propriedade}-${anoAtual}`);
  }

  async syncDashboardReproducao(
    id_propriedade: string,
    user: SyncUser,
    paginationDto: SyncPaginationDto,
  ): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const dashboardData = await this.dashboardService.getReproducaoMetricas(id_propriedade);

    return this.buildDashboardResponse(this.toRecord(dashboardData), pagination, `dashboard-reproducao-${id_propriedade}`);
  }

  async syncDashboard(id_propriedade: string, user: SyncUser, paginationDto: SyncPaginationDto): Promise<SyncResponse<Record<string, unknown>>> {
    await this.validatePropertyAccess(id_propriedade, user);
    const pagination = this.getPagination(paginationDto);
    const dashboardData = await this.dashboardService.getStats(id_propriedade);

    return this.buildDashboardResponse(this.toRecord(dashboardData), pagination, `dashboard-stats-${id_propriedade}`);
  }

  private async validatePropertyAccess(id_propriedade: string, user: SyncUser): Promise<void> {
    const userId = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);
  }

  private getPagination(paginationDto: SyncPaginationDto): PaginationInfo {
    const page = Math.max(paginationDto.page ?? 1, 1);
    const limit = Math.min(Math.max(paginationDto.limit ?? 200, 1), 200);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  private buildCollectionResponse(result: SyncQueryResult, pagination: PaginationInfo, idField: string): SyncResponse<Record<string, unknown>> {
    const syncedAt = new Date().toISOString();
    const updatedAt = result.updatedAt ?? syncedAt;

    return {
      data: result.data.map((item) => this.normalizeRecord(item, idField)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        updated_at: updatedAt,
        synced_at: syncedAt,
      },
    };
  }

  private buildDashboardResponse(
    dashboardData: Record<string, unknown>,
    pagination: PaginationInfo,
    dashboardId: string,
  ): SyncResponse<Record<string, unknown>> {
    const syncedAt = new Date().toISOString();

    return {
      data: [
        {
          ...dashboardData,
          id: dashboardId,
          updated_at: syncedAt,
          deleted_at: null,
        },
      ],
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: 1,
        updated_at: syncedAt,
        synced_at: syncedAt,
      },
    };
  }

  private normalizeRecord(record: Record<string, unknown>, idField: string): Record<string, unknown> {
    const idValue = record[idField] ?? record.id ?? null;
    const updatedAt = (record.updatedAt as string | null | undefined) ?? (record.updated_at as string | null | undefined) ?? null;
    const deletedAt = (record.deletedAt as string | null | undefined) ?? (record.deleted_at as string | null | undefined) ?? null;

    return {
      ...record,
      id: idValue,
      updated_at: updatedAt,
      deleted_at: deletedAt,
    };
  }

  private toRecord<T extends object>(value: T): Record<string, unknown> {
    return { ...value } as Record<string, unknown>;
  }
}
