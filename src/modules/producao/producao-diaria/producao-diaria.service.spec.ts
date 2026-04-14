import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { ProducaoDiariaRepositoryDrizzle } from './repositories';
import { ProducaoDiariaService } from './producao-diaria.service';

describe('ProducaoDiariaService', () => {
  let service: ProducaoDiariaService;
  let repository: jest.Mocked<ProducaoDiariaRepositoryDrizzle>;
  let logger: jest.Mocked<LoggerService>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const dto = {
    idPropriedade: '123e4567-e89b-42d3-a456-426614174099',
    quantidade: 420.75,
    dtRegistro: '2026-04-13T18:00:00.000Z',
    observacao: 'fim de dia',
  };

  beforeEach(() => {
    repository = {
      criar: jest.fn(),
      listarTodos: jest.fn(),
      listarPorPropriedade: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
      softDelete: jest.fn(),
      buscarPorIdComDeletados: jest.fn(),
      restaurar: jest.fn(),
      listarComDeletadosPorPropriedades: jest.fn(),
    } as unknown as jest.Mocked<ProducaoDiariaRepositoryDrizzle>;

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

    service = new ProducaoDiariaService(repository, logger, authHelper);

    authHelper.getUserId.mockResolvedValue('user-estoque');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
    authHelper.getUserPropriedades.mockResolvedValue([dto.idPropriedade]);
  });

  it('deve criar registro usando id do usuário autenticado (sem spoofing)', async () => {
    repository.criar.mockResolvedValue({
      idEstoque: 'estoque-1',
      idPropriedade: dto.idPropriedade,
      idUsuario: 'user-estoque',
      quantidade: '420.75',
      dtRegistro: dto.dtRegistro,
      observacao: dto.observacao,
      createdAt: dto.dtRegistro,
      updatedAt: dto.dtRegistro,
      deletedAt: null,
    } as any);

    const result = await service.create(dto as any, { email: 'owner@test.com' });

    expect(repository.criar).toHaveBeenCalledWith(dto, 'user-estoque');
    expect(result).toMatchObject({ id_usuario: 'user-estoque' });
  });

  it('deve falhar restore com BadRequest quando registro não está removido', async () => {
    repository.buscarPorIdComDeletados.mockResolvedValue({
      idEstoque: 'estoque-1',
      idPropriedade: dto.idPropriedade,
      deletedAt: null,
    } as any);

    await expect(service.restore('estoque-1', { email: 'owner@test.com' })).rejects.toThrow(BadRequestException);
    expect(repository.restaurar).not.toHaveBeenCalled();
  });

  it('deve bloquear findByPropriedade quando usuário não tem acesso', async () => {
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.findByPropriedade(dto.idPropriedade, { page: 1, limit: 10 }, { email: 'x@test.com' })).rejects.toThrow(NotFoundException);
    expect(repository.listarPorPropriedade).not.toHaveBeenCalled();
  });
});
