import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AlertasService } from '../../alerta/alerta.service';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { DadosSanitariosRepositoryDrizzle } from './repositories';
import { DadosSanitariosService } from './dados-sanitarios.service';

describe('DadosSanitariosService', () => {
  let service: DadosSanitariosService;
  let repository: jest.Mocked<DadosSanitariosRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;

  beforeEach(() => {
    repository = {
      findByPropriedade: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      restore: jest.fn(),
      findAllWithDeleted: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<DadosSanitariosRepositoryDrizzle>;

    const alertasService = {} as AlertasService;
    const logger = {} as LoggerService;
    const databaseService = {} as DatabaseService;

    authHelper = {
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    authHelper.validatePropriedadeAccess.mockResolvedValue();

    service = new DadosSanitariosService(repository, logger, databaseService, authHelper, alertasService);
  });

  it('deve validar ownership ao listar por propriedade', async () => {
    repository.findByPropriedade.mockResolvedValue({ data: [], total: 0 } as any);

    await service.findByPropriedade('prop-1', { page: 1, limit: 10 }, 'user-1');

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
  });

  it('deve restaurar quando registro estiver removido', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({
      idSanit: 'san-1',
      deletedAt: '2026-04-14T10:00:00.000Z',
    } as any);
    repository.restore.mockResolvedValue({ idSanit: 'san-1', deletedAt: null } as any);

    const result = await service.restore('san-1');

    expect(repository.restore).toHaveBeenCalledWith('san-1');
    expect(result).toMatchObject({ message: 'Registro restaurado com sucesso' });
  });

  it('deve falhar restore quando registro nao esta removido', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({
      idSanit: 'san-1',
      deletedAt: null,
    } as any);

    await expect(service.restore('san-1')).rejects.toThrow(BadRequestException);
    expect(repository.restore).not.toHaveBeenCalled();
  });

  it('deve usar mensagem segura ao capturar erro desconhecido na migracao', async () => {
    repository.findAllWithDeleted.mockResolvedValue([
      {
        idSanit: 'san-1',
        doenca: 'Mastiti',
      },
    ] as any);
    repository.update.mockRejectedValue('erro sem objeto Error');

    const result = await service.migrarNormalizacaoDoencas();

    expect(result).toMatchObject({
      atualizados: 0,
      erros: [{ id: 'san-1', erro: 'erro sem objeto Error' }],
    });
  });
});
