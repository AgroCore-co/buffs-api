import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService } from '../../../core/cache/cache.service';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AlertasService } from '../../alerta/alerta.service';
import { CoberturaRepositoryDrizzle } from './repositories';
import { CoberturaService } from './cobertura.service';
import { CoberturaValidatorDrizzle } from './validators/cobertura.validator.drizzle';

describe('CoberturaService', () => {
  let service: CoberturaService;
  let authHelper: jest.Mocked<AuthHelperService>;
  let coberturaRepo: jest.Mocked<CoberturaRepositoryDrizzle>;

  const user = { email: 'cobertura@example.com' };

  beforeEach(() => {
    const databaseService = {
      db: {},
    } as unknown as jest.Mocked<DatabaseService>;

    authHelper = {
      getUserId: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
      getUserPropriedades: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    const logger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
      logApiRequest: jest.fn(),
      logDatabaseOperation: jest.fn(),
      logError: jest.fn(),
      logImportacao: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const alertasService = {
      createIfNotExists: jest.fn(),
    } as unknown as jest.Mocked<AlertasService>;

    const validator = {
      validarAnimalAtivo: jest.fn(),
      validarGestacaoDuplicada: jest.fn(),
      validarIdadeMinimaReproducao: jest.fn(),
      validarIdadeMaximaReproducao: jest.fn(),
      validarIntervaloEntrePartos: jest.fn(),
      validarIntervaloUsoMacho: jest.fn(),
    } as unknown as jest.Mocked<CoberturaValidatorDrizzle>;

    coberturaRepo = {
      findByPropriedades: jest.fn(),
      findByPropriedade: jest.fn(),
    } as unknown as jest.Mocked<CoberturaRepositoryDrizzle>;

    const cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    service = new CoberturaService(databaseService, authHelper, logger, alertasService, validator, coberturaRepo, cacheService);

    authHelper.getUserId.mockResolvedValue('usr-1');
    authHelper.getUserPropriedades.mockResolvedValue(['prop-1']);
    authHelper.validatePropriedadeAccess.mockResolvedValue();
  });

  it('deve filtrar findAll por propriedades do usuário autenticado', async () => {
    coberturaRepo.findByPropriedades.mockResolvedValue({
      data: [],
      total: 0,
    } as any);

    const result = await service.findAll({ page: 1, limit: 10 }, user);

    expect(authHelper.getUserId).toHaveBeenCalledWith(user);
    expect(authHelper.getUserPropriedades).toHaveBeenCalledWith('usr-1');
    expect(coberturaRepo.findByPropriedades).toHaveBeenCalledWith(['prop-1'], 0, 10);
    expect(result.meta.total).toBe(0);
  });

  it('deve validar ownership em findByPropriedade', async () => {
    coberturaRepo.findByPropriedade.mockResolvedValue({
      data: [],
      total: 0,
    } as any);

    await service.findByPropriedade('prop-1', { page: 1, limit: 10 }, user);

    expect(authHelper.getUserId).toHaveBeenCalledWith(user);
    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('usr-1', 'prop-1');
    expect(coberturaRepo.findByPropriedade).toHaveBeenCalledWith('prop-1', 0, 10);
  });

  it('deve propagar erro quando usuário não tiver acesso à propriedade', async () => {
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.findByPropriedade('prop-1', { page: 1, limit: 10 }, user)).rejects.toThrow(NotFoundException);
    expect(coberturaRepo.findByPropriedade).not.toHaveBeenCalled();
  });
});
