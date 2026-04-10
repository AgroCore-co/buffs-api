import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthFacadeService } from './auth-facade.service';
import { AuthService } from './auth.service';
import { Cargo } from '../usuario/enums/cargo.enum';
import { SignUpFuncionarioDto } from './dto/signup-funcionario.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let authFacade: jest.Mocked<AuthFacadeService>;

  beforeEach(() => {
    authService = {
      signIn: jest.fn(),
      refresh: jest.fn(),
      signOut: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    authFacade = {
      registerProprietario: jest.fn(),
      registerFuncionario: jest.fn(),
    } as unknown as jest.Mocked<AuthFacadeService>;

    controller = new AuthController(authService, authFacade);
  });

  it('deve delegar signup-funcionario para a facade', async () => {
    const dto: SignUpFuncionarioDto = {
      email: 'funcionario@example.com',
      password: 'senha123',
      nome: 'Funcionario Teste',
      telefone: '11999998888',
      cargo: Cargo.FUNCIONARIO as Cargo.FUNCIONARIO,
    };

    authFacade.registerFuncionario.mockResolvedValue({ message: 'Funcionário registrado com sucesso.' } as never);

    const result = await controller.signupFuncionario(dto, 'auth-id-solicitante');

    expect(authFacade.registerFuncionario).toHaveBeenCalledWith(dto, 'auth-id-solicitante');
    expect(result).toEqual({ message: 'Funcionário registrado com sucesso.' });
  });

  it('deve delegar refresh para o service', async () => {
    authService.refresh.mockResolvedValue({ access_token: 'novo-token' } as never);

    const result = await controller.refresh({ refresh_token: 'refresh-token' });

    expect(authService.refresh).toHaveBeenCalledWith('refresh-token');
    expect(result).toEqual({ access_token: 'novo-token' });
  });

  it('deve rejeitar signout sem bearer token', async () => {
    await expect(controller.signOut(undefined)).rejects.toThrow(UnauthorizedException);
  });

  it('deve delegar signout com bearer token para o service', async () => {
    authService.signOut.mockResolvedValue({ message: 'Logout realizado com sucesso.' } as never);

    const result = await controller.signOut('Bearer access-token-valido');

    expect(authService.signOut).toHaveBeenCalledWith('access-token-valido');
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
  });
});
