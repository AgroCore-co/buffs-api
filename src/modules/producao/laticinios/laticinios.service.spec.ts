import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { LaticiniosRepositoryDrizzle } from './repositories';
import { LaticiniosService } from './laticinios.service';

describe('LaticiniosService', () => {
  let service: LaticiniosService;
  let repository: jest.Mocked<LaticiniosRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const idPropriedade = '123e4567-e89b-42d3-a456-426614174055';

  beforeEach(() => {
    repository = {
      listarTodasPorPropriedades: jest.fn(),
      buscarPorIdComDeletados: jest.fn(),
      restaurar: jest.fn(),
      buscarPorId: jest.fn(),
      listarPorPropriedade: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
      listarComDeletadosPorPropriedades: jest.fn(),
    } as unknown as jest.Mocked<LaticiniosRepositoryDrizzle>;

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      logError: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    authHelper = {
      getUserId: jest.fn(),
      getUserPropriedades: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    service = new LaticiniosService(repository, logger, authHelper);

    authHelper.getUserId.mockResolvedValue('user-laticinio');
    authHelper.getUserPropriedades.mockResolvedValue([idPropriedade]);
    authHelper.validatePropriedadeAccess.mockResolvedValue();
  });

  it('deve restringir findAll às propriedades do usuário autenticado', async () => {
    repository.listarTodasPorPropriedades.mockResolvedValue([
      {
        idIndustria: 'ind-1',
        nome: 'Laticínio Teste',
        representante: 'Resp',
        contato: 'Contato',
        observacao: null,
        idPropriedade,
        createdAt: '2026-04-13T10:00:00.000Z',
        updatedAt: '2026-04-13T10:00:00.000Z',
        deletedAt: null,
      },
    ] as any);

    const result = await service.findAll({ email: 'owner@test.com' });

    expect(repository.listarTodasPorPropriedades).toHaveBeenCalledWith([idPropriedade]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id_industria: 'ind-1' });
  });

  it('deve falhar restore com BadRequest quando indústria não está removida', async () => {
    repository.buscarPorIdComDeletados.mockResolvedValue({
      idIndustria: 'ind-1',
      idPropriedade,
      deletedAt: null,
    } as any);

    await expect(service.restore('ind-1', { email: 'owner@test.com' })).rejects.toThrow(BadRequestException);
    expect(repository.restaurar).not.toHaveBeenCalled();
  });
});
