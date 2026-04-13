import { Test, TestingModule } from '@nestjs/testing';
import { RacaService } from './raca.service';
import { RacaRepositoryDrizzle } from './repositories/raca.repository.drizzle';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';

describe('RacaService', () => {
  let service: RacaService;
  let repository: jest.Mocked<RacaRepositoryDrizzle>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RacaService,
        {
          provide: RacaRepositoryDrizzle,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findByIdWithDeleted: jest.fn(),
            restore: jest.fn(),
            findAllWithDeleted: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            logError: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            reset: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RacaService);
    repository = module.get(RacaRepositoryDrizzle);
    cacheService = module.get(CacheService);
    cacheService.reset.mockResolvedValue();
  });

  it('deve invalidar cache ao criar raça', async () => {
    repository.create.mockResolvedValue({ idRaca: 'r1', nome: 'Murrah' } as any);

    await service.create({ nome: 'Murrah' });

    expect(cacheService.reset).toHaveBeenCalled();
  });

  it('deve invalidar cache ao atualizar raça', async () => {
    repository.findById.mockResolvedValue({ idRaca: 'r1', nome: 'Murrah' } as any);
    repository.update.mockResolvedValue({ idRaca: 'r1', nome: 'Mediterraneo' } as any);

    await service.update('r1', { nome: 'Mediterraneo' });

    expect(cacheService.reset).toHaveBeenCalled();
  });

  it('deve invalidar cache ao remover e restaurar raça', async () => {
    repository.findById.mockResolvedValue({ idRaca: 'r1', nome: 'Murrah' } as any);
    repository.softDelete.mockResolvedValue({ idRaca: 'r1', deletedAt: '2026-04-13T12:00:00.000Z' } as any);

    await service.softDelete('r1');

    repository.findByIdWithDeleted.mockResolvedValue({ idRaca: 'r1', deletedAt: '2026-04-13T12:00:00.000Z' } as any);
    repository.restore.mockResolvedValue({ idRaca: 'r1', deletedAt: null } as any);

    await service.restore('r1');

    expect(cacheService.reset).toHaveBeenCalledTimes(2);
  });
});
