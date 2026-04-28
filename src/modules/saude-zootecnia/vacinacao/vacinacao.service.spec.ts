import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { VacinacaoRepositoryDrizzle } from './repositories';
import { VacinacaoService } from './vacinacao.service';

describe('VacinacaoService', () => {
  let service: VacinacaoService;
  let repository: jest.Mocked<VacinacaoRepositoryDrizzle>;

  beforeEach(() => {
    repository = {
      findByBufalo: jest.fn(),
      findVacinasByBufalo: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<VacinacaoRepositoryDrizzle>;

    const logger = {} as LoggerService;
    const databaseService = {} as DatabaseService;

    service = new VacinacaoService(repository, logger, databaseService);
  });

  it('deve paginar listagem de vacinação por búfalo', async () => {
    repository.findByBufalo.mockResolvedValue({
      data: [{ idSanit: 'v1' }],
      total: 11,
    } as any);

    const result = await service.findAllByBufalo('buf-1', { page: 2, limit: 5 });

    expect(repository.findByBufalo).toHaveBeenCalledWith('buf-1', 5, 5);
    expect(result.meta).toMatchObject({
      page: 2,
      limit: 5,
      total: 11,
    });
    expect(result.data).toHaveLength(1);
  });

  it('deve paginar listagem de vacinas específicas por búfalo', async () => {
    repository.findVacinasByBufalo.mockResolvedValue({
      data: [{ idSanit: 'v2' }],
      total: 3,
    } as any);

    const result = await service.findVacinasByBufaloId('buf-1', { page: 1, limit: 2 });

    expect(repository.findVacinasByBufalo).toHaveBeenCalledWith('buf-1', 2, 0);
    expect(result.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
    });
  });

  it('deve usar busca incluindo removidos no restore', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({
      idSanit: 'v3',
      deletedAt: '2026-04-14T10:00:00.000Z',
    } as any);
    repository.restore.mockResolvedValue({ idSanit: 'v3', deletedAt: null } as any);

    await service.restore('v3');

    expect(repository.findByIdIncludingDeleted).toHaveBeenCalledWith('v3');
    expect(repository.restore).toHaveBeenCalledWith('v3');
  });
});
