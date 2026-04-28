import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { GrupoRepositoryDrizzle } from './repositories/grupo.repository.drizzle';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService } from '../../../core/cache/cache.service';

describe('GrupoService', () => {
  let service: GrupoService;
  let repository: jest.Mocked<GrupoRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser = { email: 'user@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrupoService,
        {
          provide: GrupoRepositoryDrizzle,
          useValue: {
            create: jest.fn(),
            findByPropriedades: jest.fn(),
            findByPropriedade: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findByIdWithDeleted: jest.fn(),
            restore: jest.fn(),
            findAllWithDeletedByPropriedades: jest.fn(),
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
          provide: AuthHelperService,
          useValue: {
            getUserId: jest.fn(),
            getUserPropriedades: jest.fn(),
            validatePropriedadeAccess: jest.fn(),
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

    service = module.get(GrupoService);
    repository = module.get(GrupoRepositoryDrizzle);
    authHelper = module.get(AuthHelperService);
    cacheService = module.get(CacheService);
  });

  it('deve validar ownership e invalidar cache ao criar', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
    repository.create.mockResolvedValue({
      idGrupo: 'grupo-1',
      nomeGrupo: 'Lactacao',
      idPropriedade: 'prop-1',
    } as any);
    cacheService.reset.mockResolvedValue();

    await service.create({ nomeGrupo: 'Lactacao', idPropriedade: 'prop-1' } as any, mockUser);

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    expect(cacheService.reset).toHaveBeenCalled();
  });

  it('deve listar grupos somente das propriedades do usuário', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.getUserPropriedades.mockResolvedValue(['prop-1', 'prop-2']);
    repository.findByPropriedades.mockResolvedValue([]);

    await service.findAll(mockUser);

    expect(repository.findByPropriedades).toHaveBeenCalledWith(['prop-1', 'prop-2']);
  });

  it('deve bloquear findOne quando usuário não tem acesso à propriedade do grupo', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    repository.findById.mockResolvedValue({
      idGrupo: 'grupo-1',
      idPropriedade: 'prop-forbidden',
    } as any);
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.findOne('grupo-1', mockUser)).rejects.toThrow(NotFoundException);
  });
});
