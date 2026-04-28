import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { LoggerService } from 'src/core/logger/logger.service';
import { AuthHelperService } from 'src/core/services/auth-helper.service';
import { CreateFuncionarioDto } from '../dto/create-funcionario.dto';
import { Cargo } from '../enums/cargo.enum';
import { formatDateFields } from '../../../core/utils/date-formatter.utils';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from '../repositories';
import { AuthFacadeService } from '../../auth/auth-facade.service';

@Injectable()
export class FuncionarioService {
  constructor(
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
    private readonly authFacade: AuthFacadeService,
    private readonly usuarioRepository: UsuarioRepositoryDrizzle,
    private readonly usuarioPropriedadeRepository: UsuarioPropriedadeRepositoryDrizzle,
    private readonly propriedadeRepository: PropriedadeRepositoryHelper,
  ) {}

  /**
   * Busca o usuário completo pelo auth_id
   */
  private async getUserByAuthId(authId: string) {
    const usuario = await this.usuarioRepository.buscarPorAuthId(authId);

    if (!usuario) {
      this.logger.warn(`[FuncionarioService] Usuário não encontrado`, { authId });
      throw new NotFoundException('Usuário não encontrado no sistema.');
    }

    return formatDateFields(usuario);
  }

  /**
   * Busca todas as propriedades onde o usuário é o dono.
   * Delegado ao AuthHelperService para evitar duplicação.
   */
  private async getUserPropriedades(userId: string): Promise<string[]> {
    return this.authHelper.getUserPropriedades(userId);
  }

  /**
   * Cria um novo funcionário, o autentica no Supabase e o vincula a propriedades.
   * @param createFuncionarioDto Dados do novo funcionário.
   * @param authId auth_id do proprietário (logado) que está realizando a ação.
   */
  async createFuncionario(createFuncionarioDto: CreateFuncionarioDto, authId: string) {
    if (createFuncionarioDto.cargo === Cargo.PROPRIETARIO) {
      throw new BadRequestException('Não é possível criar um usuário com cargo PROPRIETARIO por este endpoint.');
    }

    this.logger.log('[FuncionarioService] createFuncionario delegando para AuthFacade', {
      authId,
      email: createFuncionarioDto.email,
      cargo: createFuncionarioDto.cargo,
    });

    return this.authFacade.registerFuncionario(
      {
        email: createFuncionarioDto.email,
        password: createFuncionarioDto.password,
        nome: createFuncionarioDto.nome,
        telefone: createFuncionarioDto.telefone,
        cargo: createFuncionarioDto.cargo as Cargo.GERENTE | Cargo.FUNCIONARIO | Cargo.VETERINARIO,
        idEndereco: createFuncionarioDto.idEndereco,
        idPropriedade: createFuncionarioDto.idPropriedade,
      },
      authId,
    );
  }

  /**
   * Lista todos os funcionários de uma propriedade específica
   */
  async listarFuncionariosPorPropriedade(idPropriedade: string, authId: string) {
    this.logger.log(`[FuncionarioService] listarFuncionariosPorPropriedade chamado`, {
      idPropriedade,
      authId,
    });

    const proprietario = await this.getUserByAuthId(authId);
    const propriedade = await this.propriedadeRepository.pertenceAoDono(idPropriedade, proprietario.idUsuario);

    if (!propriedade) {
      this.logger.warn(`[FuncionarioService] Acesso negado: não é proprietário desta propriedade`, {
        authId,
        idPropriedade,
      });
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    const funcionarios = await this.usuarioPropriedadeRepository.listarUsuariosPorPropriedade(idPropriedade);

    return funcionarios.map((func) => ({
      id_usuario: func.idUsuario,
      nome: func.nome,
      email: func.email,
      telefone: func.telefone,
      cargo: func.cargo,
      created_at: func.createdAt,
    }));
  }

  /**
   * Lista todos os funcionários de todas as propriedades do proprietário
   */
  async listarMeusFuncionarios(authId: string) {
    this.logger.log(`[FuncionarioService] listarMeusFuncionarios chamado`, { authId });

    const proprietario = await this.getUserByAuthId(authId);
    const propriedadesProprietario = await this.getUserPropriedades(proprietario.idUsuario);

    const funcionarios = await this.usuarioPropriedadeRepository.listarUsuariosPorPropriedades(propriedadesProprietario);

    return funcionarios.map((func) => ({
      id_usuario: func.idUsuario,
      nome: func.nome,
      email: func.email,
      telefone: func.telefone,
      cargo: func.cargo,
      created_at: func.createdAt,
      propriedade: func.propriedade?.nome,
      id_propriedade: func.propriedade?.id_propriedade,
    }));
  }

  /**
   * Remove um funcionário de uma propriedade (desvincular)
   */
  async desvincularFuncionario(idUsuario: string, idPropriedade: string, authId: string) {
    this.logger.log(`[FuncionarioService] desvincularFuncionario chamado`, {
      idUsuario,
      idPropriedade,
      authId,
    });

    const proprietario = await this.getUserByAuthId(authId);
    const propriedade = await this.propriedadeRepository.pertenceAoDono(idPropriedade, proprietario.idUsuario);

    if (!propriedade) {
      this.logger.warn(`[FuncionarioService] Acesso negado para desvincular: não é proprietário`, {
        authId,
        idPropriedade,
      });
      throw new ForbiddenException('Acesso negado: você não é proprietário desta propriedade.');
    }

    const desvinculado = await this.usuarioPropriedadeRepository.desvincular(idUsuario, idPropriedade);

    if (!desvinculado) {
      throw new NotFoundException('Vínculo não encontrado.');
    }

    await this.authHelper.invalidarCachePropriedades(idUsuario);

    return { message: 'Funcionário desvinculado com sucesso.' };
  }
}
