import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { AlertasService } from '../../alerta/alerta.service';
import { GeminiService } from '../../../core/gemini/gemini.service';
import { BufaloRepositoryDrizzle } from '../../rebanho/bufalo/repositories/bufalo.repository.drizzle';
import { LactacaoRepositoryDrizzle } from '../lactacao/repositories';
import { OrdenhaRepositoryDrizzle } from './repositories';
import { OrdenhaService } from './ordenha.service';

describe('OrdenhaService', () => {
  let service: OrdenhaService;
  let repository: jest.Mocked<OrdenhaRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;

  beforeEach(() => {
    repository = {
      buscarPorId: jest.fn(),
      listarTodos: jest.fn(),
    } as unknown as jest.Mocked<OrdenhaRepositoryDrizzle>;

    authHelper = {
      getUserId: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    const bufaloRepo = {} as BufaloRepositoryDrizzle;
    const cicloRepo = {} as LactacaoRepositoryDrizzle;
    const alertasService = {} as AlertasService;
    const geminiService = {} as GeminiService;

    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      logError: jest.fn(),
    } as unknown as LoggerService;

    service = new OrdenhaService(repository, authHelper, bufaloRepo, cicloRepo, alertasService, geminiService, logger);

    authHelper.getUserId.mockResolvedValue('user-ordenha');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
  });

  it('deve retornar NotFound quando registro não existir (sem mensagem de ownership)', async () => {
    repository.buscarPorId.mockResolvedValue(null as any);

    await expect(service.findOne('lact-1', { email: 'a@a.com' })).rejects.toThrow(NotFoundException);
    expect(authHelper.validatePropriedadeAccess).not.toHaveBeenCalled();
  });

  it('deve validar acesso à propriedade quando registro existir', async () => {
    repository.buscarPorId.mockResolvedValue({
      idLact: 'lact-1',
      idPropriedade: 'prop-1',
      dtOrdenha: '2026-04-13T10:00:00.000Z',
    } as any);

    await service.findOne('lact-1', { email: 'a@a.com' });

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-ordenha', 'prop-1');
  });

  it('deve manter contrato paginado em findAll', async () => {
    repository.listarTodos.mockResolvedValue({
      registros: [
        {
          idLact: 'lact-1',
          dtOrdenha: '2026-04-13T10:00:00.000Z',
        },
      ],
      total: 1,
    } as any);

    const response = await service.findAll(2, 5);

    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('meta');
    expect(response.meta).toMatchObject({
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: true,
    });
  });
});
