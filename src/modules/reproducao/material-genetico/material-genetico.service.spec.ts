import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { MaterialGeneticoService } from './material-genetico.service';
import { MaterialGeneticoRepositoryDrizzle } from './repositories/material-genetico.repository.drizzle';

describe('MaterialGeneticoService', () => {
  let service: MaterialGeneticoService;
  let materialRepo: jest.Mocked<MaterialGeneticoRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const user = { email: 'repro@example.com' };

  beforeEach(() => {
    materialRepo = {
      create: jest.fn(),
      findAllByPropriedadesPaginated: jest.fn(),
      findByPropriedade: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findByIdSimple: jest.fn(),
      restore: jest.fn(),
      findAllWithDeletedByPropriedades: jest.fn(),
    } as unknown as jest.Mocked<MaterialGeneticoRepositoryDrizzle>;

    logger = {
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

    authHelper = {
      getUserId: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
      getUserPropriedades: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    service = new MaterialGeneticoService(materialRepo, logger, authHelper);

    authHelper.getUserId.mockResolvedValue('usr-1');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
    authHelper.getUserPropriedades.mockResolvedValue(['prop-1']);
  });

  it('deve rejeitar Coleta Própria sem idBufaloOrigem', async () => {
    await expect(
      service.create(
        {
          idPropriedade: 'prop-1',
          tipo: 'Sêmen',
          origem: 'Coleta Própria',
          dataColeta: '2025-01-01T00:00:00.000Z',
        } as any,
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(materialRepo.create).not.toHaveBeenCalled();
  });

  it('deve rejeitar Compra sem fornecedor', async () => {
    await expect(
      service.create(
        {
          idPropriedade: 'prop-1',
          tipo: 'Embrião',
          origem: 'Compra',
          dataColeta: '2025-01-01T00:00:00.000Z',
        } as any,
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(materialRepo.create).not.toHaveBeenCalled();
  });

  it('deve validar ownership antes de criar material', async () => {
    materialRepo.create.mockResolvedValue({ idMaterial: 'mat-1' } as any);

    const result = await service.create(
      {
        idPropriedade: 'prop-1',
        tipo: 'Embrião',
        origem: 'Compra',
        fornecedor: 'Central Genetica XYZ',
        dataColeta: '2025-01-01T00:00:00.000Z',
      } as any,
      user,
    );

    expect(authHelper.getUserId).toHaveBeenCalledWith(user);
    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('usr-1', 'prop-1');
    expect(materialRepo.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      message: 'Material genético criado com sucesso',
      data: { idMaterial: 'mat-1' },
    });
  });

  it('deve filtrar findAll por propriedades do usuário', async () => {
    materialRepo.findAllByPropriedadesPaginated.mockResolvedValue({
      data: [{ idMaterial: 'mat-1' }],
      total: 1,
    } as any);

    const result = await service.findAll({ page: 1, limit: 10 }, user);

    expect(authHelper.getUserId).toHaveBeenCalledWith(user);
    expect(authHelper.getUserPropriedades).toHaveBeenCalledWith('usr-1');
    expect(materialRepo.findAllByPropriedadesPaginated).toHaveBeenCalledWith(['prop-1'], 0, 10);
    expect(result.meta.total).toBe(1);
  });

  it('deve rejeitar update inconsistente quando origem Compra mantem idBufaloOrigem', async () => {
    materialRepo.findById.mockResolvedValue({
      idMaterial: 'mat-1',
      idPropriedade: 'prop-1',
      origem: 'Coleta Própria',
      idBufaloOrigem: 'buf-1',
      fornecedor: null,
    } as any);

    await expect(
      service.update(
        'mat-1',
        {
          origem: 'Compra',
          fornecedor: 'Fornecedor X',
          idBufaloOrigem: 'buf-1',
        } as any,
        user,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(materialRepo.update).not.toHaveBeenCalled();
  });
});
