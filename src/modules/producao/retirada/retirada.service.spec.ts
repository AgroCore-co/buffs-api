import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateRetiradaDto } from './dto/create-retirada.dto';
import { RetiradaRepositoryDrizzle } from './repositories';
import { RetiradaService } from './retirada.service';

describe('RetiradaService', () => {
  let service: RetiradaService;
  let repository: jest.Mocked<RetiradaRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const dto: CreateRetiradaDto = {
    idIndustria: '123e4567-e89b-42d3-a456-426614174001',
    idPropriedade: '123e4567-e89b-42d3-a456-426614174002',
    quantidade: 120.5,
    dtColeta: '2026-04-13T08:00:00.000Z',
    resultadoTeste: true,
    observacao: 'ok',
  };

  beforeEach(() => {
    repository = {
      criar: jest.fn(),
      listarTodas: jest.fn(),
      listarPorPropriedade: jest.fn(),
      obterEstatisticasPorPropriedade: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
      buscarPorIdComDeletados: jest.fn(),
      restaurar: jest.fn(),
      listarComDeletadosPorPropriedades: jest.fn(),
    } as unknown as jest.Mocked<RetiradaRepositoryDrizzle>;

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      logError: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    authHelper = {
      getUserId: jest.fn(),
      validatePropriedadeAccess: jest.fn(),
      getUserPropriedades: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    service = new RetiradaService(repository, logger, authHelper);

    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
    authHelper.getUserPropriedades.mockResolvedValue(['123e4567-e89b-42d3-a456-426614174002']);
  });

  it('deve propagar BadRequestException no create sem converter para 500', async () => {
    repository.criar.mockRejectedValue(new BadRequestException('Indústria inválida'));

    await expect(service.create(dto, { email: 'user@test.com' })).rejects.toThrow(BadRequestException);
    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', dto.idPropriedade);
  });

  it('deve falhar restore com BadRequest quando coleta não está removida', async () => {
    repository.buscarPorIdComDeletados.mockResolvedValue({
      idColeta: 'coleta-1',
      idPropriedade: '123e4567-e89b-42d3-a456-426614174002',
      deletedAt: null,
    } as any);

    await expect(service.restore('coleta-1', { email: 'user@test.com' })).rejects.toThrow(BadRequestException);

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', '123e4567-e89b-42d3-a456-426614174002');
    expect(repository.restaurar).not.toHaveBeenCalled();
  });

  it('deve listar deletados escopado pelas propriedades do usuário', async () => {
    repository.listarComDeletadosPorPropriedades.mockResolvedValue([
      {
        idColeta: 'coleta-1',
        idIndustria: dto.idIndustria,
        resultadoTeste: true,
        observacao: 'ok',
        quantidade: '120.5',
        dtColeta: dto.dtColeta,
        idFuncionario: 'user-1',
        idPropriedade: dto.idPropriedade,
        createdAt: '2026-04-13T08:00:00.000Z',
        updatedAt: '2026-04-13T08:00:00.000Z',
        deletedAt: '2026-04-13T10:00:00.000Z',
      },
    ] as any);

    const result = await service.findAllWithDeleted({ email: 'user@test.com' });

    expect(authHelper.getUserPropriedades).toHaveBeenCalledWith('user-1');
    expect(repository.listarComDeletadosPorPropriedades).toHaveBeenCalledWith(['123e4567-e89b-42d3-a456-426614174002']);
    expect(result[0]).toMatchObject({ id_coleta: 'coleta-1' });
  });
});
