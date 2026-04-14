import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { DadosZootecnicosRepositoryDrizzle } from './repositories';
import { DadosZootecnicosService } from './dados-zootecnicos.service';

describe('DadosZootecnicosService', () => {
  let service: DadosZootecnicosService;
  let repository: jest.Mocked<DadosZootecnicosRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;

  beforeEach(() => {
    repository = {
      findAllByPropriedade: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<DadosZootecnicosRepositoryDrizzle>;

    const logger = {} as LoggerService;
    const databaseService = {} as DatabaseService;

    authHelper = {
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    authHelper.validatePropriedadeAccess.mockResolvedValue();

    service = new DadosZootecnicosService(repository, logger, databaseService, authHelper);
  });

  it('deve validar ownership ao listar por propriedade', async () => {
    repository.findAllByPropriedade.mockResolvedValue({ data: [], total: 0 } as any);

    await service.findAllByPropriedade('prop-1', { page: 1, limit: 10 }, 'user-1');

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
  });

  it('deve restaurar registro removido', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({ idZootec: 'z1', deletedAt: '2026-04-14T10:00:00.000Z' } as any);
    repository.restore.mockResolvedValue({ idZootec: 'z1', deletedAt: null } as any);

    const result = await service.restore('z1');

    expect(repository.restore).toHaveBeenCalledWith('z1');
    expect(result).toMatchObject({ message: 'Registro restaurado com sucesso' });
  });

  it('deve bloquear restore quando registro nao esta removido', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({ idZootec: 'z1', deletedAt: null } as any);

    await expect(service.restore('z1')).rejects.toThrow(BadRequestException);
  });
});
