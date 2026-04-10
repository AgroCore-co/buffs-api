import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { AuthHelperService } from 'src/core/services/auth-helper.service';
import { AuthFacadeService } from '../../auth/auth-facade.service';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from '../repositories';
import { Cargo } from '../enums/cargo.enum';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let authHelper: jest.Mocked<AuthHelperService>;
  let usuarioRepository: jest.Mocked<UsuarioRepositoryDrizzle>;
  let usuarioPropriedadeRepository: jest.Mocked<UsuarioPropriedadeRepositoryDrizzle>;
  let propriedadeRepository: jest.Mocked<PropriedadeRepositoryHelper>;
  let deleteUserMock: jest.Mock;

  beforeEach(() => {
    deleteUserMock = jest.fn();

    supabaseService = {
      getAdminClient: jest.fn().mockReturnValue({
        auth: {
          admin: {
            deleteUser: deleteUserMock,
          },
        },
      }),
    } as unknown as jest.Mocked<SupabaseService>;

    authHelper = {
      getUserPropriedades: jest.fn(),
      invalidarCachePropriedades: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;

    usuarioRepository = {
      listarPorIds: jest.fn(),
      buscarPorId: jest.fn(),
      remover: jest.fn(),
    } as unknown as jest.Mocked<UsuarioRepositoryDrizzle>;

    usuarioPropriedadeRepository = {
      listarUsuariosPorPropriedades: jest.fn(),
      desvincularTodasDoUsuario: jest.fn(),
    } as unknown as jest.Mocked<UsuarioPropriedadeRepositoryDrizzle>;

    propriedadeRepository = {
      listarDonosPorPropriedades: jest.fn(),
    } as unknown as jest.Mocked<PropriedadeRepositoryHelper>;

    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      logError: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const authFacade = {
      registerFuncionario: jest.fn(),
    } as unknown as jest.Mocked<AuthFacadeService>;

    service = new UsuarioService(
      supabaseService,
      logger,
      authHelper,
      authFacade,
      usuarioRepository,
      usuarioPropriedadeRepository,
      propriedadeRepository,
    );
  });

  it('deve listar usuários apenas do escopo de propriedades do solicitante', async () => {
    authHelper.getUserPropriedades.mockResolvedValue(['prop-1']);
    usuarioPropriedadeRepository.listarUsuariosPorPropriedades.mockResolvedValue([{ idUsuario: 'func-1' }, { idUsuario: 'func-1' }] as never);
    propriedadeRepository.listarDonosPorPropriedades.mockResolvedValue(['owner-1']);

    usuarioRepository.listarPorIds.mockResolvedValue([
      {
        idUsuario: 'owner-1',
        authId: 'auth-owner',
        nome: 'Owner',
        telefone: null,
        email: 'owner@example.com',
        cargo: Cargo.PROPRIETARIO,
        idEndereco: null,
        createdAt: '2026-04-10T10:00:00.000Z',
        updatedAt: '2026-04-10T10:00:00.000Z',
        endereco: null,
      },
      {
        idUsuario: 'func-1',
        authId: 'auth-func',
        nome: 'Funcionario',
        telefone: '11999998888',
        email: 'func@example.com',
        cargo: Cargo.FUNCIONARIO,
        idEndereco: null,
        createdAt: '2026-04-10T10:00:00.000Z',
        updatedAt: '2026-04-10T10:00:00.000Z',
        endereco: null,
      },
    ] as never);

    const result = await service.findAll({ id_usuario: 'owner-1', cargo: Cargo.PROPRIETARIO });

    expect(usuarioRepository.listarPorIds).toHaveBeenCalledWith(expect.arrayContaining(['owner-1', 'func-1']));
    expect(result).toHaveLength(2);
    expect(result.map((u) => u.id_usuario)).toEqual(expect.arrayContaining(['owner-1', 'func-1']));
  });

  it('deve bloquear findAll quando solicitante for inválido', async () => {
    await expect(service.findAll({})).rejects.toThrow(ForbiddenException);
  });

  it('deve remover vínculos e conta auth no remove', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ authId: 'auth-user-1' } as never);
    usuarioPropriedadeRepository.desvincularTodasDoUsuario.mockResolvedValue(2 as never);
    authHelper.invalidarCachePropriedades.mockResolvedValue(undefined as never);
    usuarioRepository.remover.mockResolvedValue(true as never);
    deleteUserMock.mockResolvedValue({ error: null } as never);

    const result = await service.remove('user-1');

    expect(usuarioPropriedadeRepository.desvincularTodasDoUsuario).toHaveBeenCalledWith('user-1');
    expect(authHelper.invalidarCachePropriedades).toHaveBeenCalledWith('user-1');
    expect(deleteUserMock).toHaveBeenCalledWith('auth-user-1');
    expect(result).toEqual({ message: 'Usuário com ID user-1 deletado com sucesso.' });
  });

  it('deve lançar erro quando remoção da conta auth falhar', async () => {
    usuarioRepository.buscarPorId.mockResolvedValue({ authId: 'auth-user-2' } as never);
    usuarioPropriedadeRepository.desvincularTodasDoUsuario.mockResolvedValue(1 as never);
    authHelper.invalidarCachePropriedades.mockResolvedValue(undefined as never);
    usuarioRepository.remover.mockResolvedValue(true as never);
    deleteUserMock.mockResolvedValue({ error: { message: 'erro no provider' } } as never);

    await expect(service.remove('user-2')).rejects.toThrow(InternalServerErrorException);
  });
});
