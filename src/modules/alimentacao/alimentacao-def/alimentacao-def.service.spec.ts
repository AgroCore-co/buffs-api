import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { AlimentacaoDefService } from './alimentacao-def.service';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { AlimentacaoDefRepositoryDrizzle } from './repositories/alimentacao-def.repository.drizzle';

describe('AlimentacaoDefService', () => {
  let service: AlimentacaoDefService;
  let repository: jest.Mocked<AlimentacaoDefRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;
  let cacheService: jest.Mocked<CacheService>;

  const entity = {
    idAlimentDef: 'def-1',
    idPropriedade: 'prop-1',
    tipoAlimentacao: 'Concentrado',
    descricao: null,
    createdAt: '2026-04-09T10:00:00.000Z',
    updatedAt: '2026-04-09T10:00:00.000Z',
    deletedAt: null,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByPropriedade: jest.fn(),
      countByPropriedade: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<AlimentacaoDefRepositoryDrizzle>;

    logger = {
      logError: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    authHelper = {
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    cacheService = {
      reset: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    service = new AlimentacaoDefService(repository, logger, authHelper, cacheService);

    authHelper.validatePropriedadeAccess.mockResolvedValue();
    cacheService.reset.mockResolvedValue();
  });

  it('deve validar ownership e invalidar cache ao criar', async () => {
    const dto: CreateAlimentacaoDefDto = {
      id_propriedade: 'prop-1',
      tipo_alimentacao: 'Concentrado',
      descricao: 'Racao',
    };

    repository.create.mockResolvedValue({ data: entity, error: null });

    const result = await service.create(dto, 'user-1');

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    expect(cacheService.reset).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ idAlimentDef: 'def-1' });
  });

  it('deve retornar void no remove e invalidar cache', async () => {
    repository.findOne.mockResolvedValue({ data: entity, error: null });
    repository.remove.mockResolvedValue({ data: null, error: null });

    const result = await service.remove('def-1', 'user-1');

    expect(result).toBeUndefined();
    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    expect(cacheService.reset).toHaveBeenCalledTimes(1);
  });

  it('deve bloquear listagem por propriedade sem acesso', async () => {
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.findByPropriedade('prop-1', { page: 1, limit: 10 }, 'user-1')).rejects.toThrow(NotFoundException);
    expect(repository.findByPropriedade).not.toHaveBeenCalled();
  });
});
