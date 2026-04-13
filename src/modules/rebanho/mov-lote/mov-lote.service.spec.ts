import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovLoteService } from './mov-lote.service';
import { MovLoteRepositoryDrizzle } from './repositories/mov-lote.repository.drizzle';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';

describe('MovLoteService', () => {
  let service: MovLoteService;
  let repository: jest.Mocked<MovLoteRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;

  const mockUser = { email: 'user@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovLoteService,
        {
          provide: MovLoteRepositoryDrizzle,
          useValue: {
            findGrupoById: jest.fn(),
            findLoteById: jest.fn(),
            findRegistroAtual: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findByPropriedades: jest.fn(),
            findByPropriedade: jest.fn(),
            findById: jest.fn(),
            remove: jest.fn(),
            findHistoricoByGrupo: jest.fn(),
            findStatusAtual: jest.fn(),
          },
        },
        {
          provide: AuthHelperService,
          useValue: {
            getUserId: jest.fn(),
            getUserPropriedades: jest.fn(),
            validatePropriedadeAccess: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MovLoteService);
    repository = module.get(MovLoteRepositoryDrizzle);
    authHelper = module.get(AuthHelperService);
  });

  it('deve listar movimentações usando apenas propriedades do usuário autenticado', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.getUserPropriedades.mockResolvedValue(['prop-1']);
    repository.findByPropriedades.mockResolvedValue({ registros: [], total: 0 } as any);

    await service.findAll(mockUser, { page: 2, limit: 20 });

    expect(repository.findByPropriedades).toHaveBeenCalledWith(['prop-1'], 2, 20);
  });

  it('deve bloquear create quando grupo não pertence à propriedade informada', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.validatePropriedadeAccess.mockResolvedValue();
    repository.findGrupoById.mockResolvedValue({ idGrupo: 'g-1', idPropriedade: 'prop-outra' } as any);

    await expect(
      service.create(
        {
          idPropriedade: 'prop-1',
          idGrupo: 'g-1',
          idLoteAtual: 'lote-1',
          dtEntrada: '2026-04-13T10:00:00.000Z',
        } as any,
        mockUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve validar idLoteAnterior atual no update parcial', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.validatePropriedadeAccess.mockResolvedValue();

    repository.findById.mockResolvedValue({
      idMovimento: 'mov-1',
      idPropriedade: 'prop-1',
      idLoteAnterior: 'lote-a',
      idGrupo: 'grupo-1',
    } as any);

    await expect(service.update('mov-1', { idLoteAtual: 'lote-a' } as any, mockUser)).rejects.toThrow(BadRequestException);
  });

  it('deve negar findByPropriedade sem ownership', async () => {
    authHelper.getUserId.mockResolvedValue('user-1');
    authHelper.validatePropriedadeAccess.mockRejectedValue(new NotFoundException('Sem acesso'));

    await expect(service.findByPropriedade('prop-1', { page: 1, limit: 10 }, mockUser)).rejects.toThrow(NotFoundException);
  });
});
