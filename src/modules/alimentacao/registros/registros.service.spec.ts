import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { RegistrosService } from './registros.service';
import { CreateRegistroPayload, RegistrosRepositoryDrizzle } from './repositories/registros.repository.drizzle';

describe('RegistrosService', () => {
  let service: RegistrosService;
  let repository: jest.Mocked<RegistrosRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const registro = {
    idRegistro: 'reg-1',
    idPropriedade: 'prop-1',
    idGrupo: 'grp-1',
    idAlimentDef: 'def-1',
    idUsuario: 'usr-1',
    quantidade: '12.5',
    unidadeMedida: 'kg',
    freqDia: 2,
    dtRegistro: '2026-04-09T10:00:00.000Z',
    createdAt: '2026-04-09T10:00:00.000Z',
    updatedAt: '2026-04-09T10:00:00.000Z',
    deletedAt: null,
  };

  const payload: CreateRegistroPayload = {
    id_propriedade: 'prop-1',
    id_grupo: 'grp-1',
    id_aliment_def: 'def-1',
    quantidade: 12.5,
    unidade_medida: 'kg',
    id_usuario: 'usr-1',
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findByPropriedade: jest.fn(),
      countByPropriedade: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<RegistrosRepositoryDrizzle>;

    logger = {
      logError: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    authHelper = {
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    service = new RegistrosService(repository, logger, authHelper);

    authHelper.validatePropriedadeAccess.mockResolvedValue();
  });

  it('deve lançar NotFound quando grupo não existe', async () => {
    repository.create.mockResolvedValue({
      data: null,
      error: null,
      validationError: 'GROUP_NOT_FOUND',
    });

    await expect(service.create(payload)).rejects.toThrow(NotFoundException);
  });

  it('deve lançar BadRequest quando definição não pertence à propriedade', async () => {
    repository.create.mockResolvedValue({
      data: null,
      error: null,
      validationError: 'ALIMENT_DEF_PROPERTY_MISMATCH',
    });

    await expect(service.create(payload)).rejects.toThrow(BadRequestException);
  });

  it('deve validar ownership no findOne por id', async () => {
    repository.findOne.mockResolvedValue({ data: registro, error: null });

    const result = await service.findOne('reg-1', 'usr-1');

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('usr-1', 'prop-1');
    expect(result).toMatchObject({ idRegistro: 'reg-1' });
  });

  it('deve retornar void no remove', async () => {
    repository.findOne.mockResolvedValue({ data: registro, error: null });
    repository.remove.mockResolvedValue({ data: null, error: null });

    const result = await service.remove('reg-1', 'usr-1');

    expect(result).toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith('reg-1');
  });
});
