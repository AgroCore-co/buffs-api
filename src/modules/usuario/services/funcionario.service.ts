import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { CreateFuncionarioDto } from '../dto/create-funcionario.dto';
import { Cargo } from '../enums/cargo.enum';
import { SupabaseClient } from '@supabase/supabase-js';
import { formatDateFields } from '../../../core/utils/date-formatter.utils';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from '../repositories';

@Injectable()
export class FuncionarioService {
  private readonly adminSupabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: LoggerService,
    private readonly usuarioRepository: UsuarioRepositoryDrizzle,
    private readonly usuarioPropriedadeRepository: UsuarioPropriedadeRepositoryDrizzle,
    private readonly propriedadeRepository: PropriedadeRepositoryHelper,
  ) {
    this.adminSupabase = this.supabaseService.getAdminClient();
  }

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
   */
  private async getUserPropriedades(userId: string): Promise<string[]> {
    this.logger.log(`[FuncionarioService] getUserPropriedades chamado`, { userId });

    const propriedades = await this.propriedadeRepository.listarPorDono(userId);

    if (propriedades.length === 0) {
      this.logger.warn(`[FuncionarioService] Usuário não possui nenhuma propriedade`, { userId });
      throw new NotFoundException('Usuário não possui nenhuma propriedade cadastrada.');
    }

    return propriedades;
  }

  /**
   * Cria um novo funcionário, o autentica no Supabase e o vincula a propriedades.
   * @param createFuncionarioDto Dados do novo funcionário.
   * @param authId auth_id do proprietário (logado) que está realizando a ação.
   */
  async createFuncionario(createFuncionarioDto: CreateFuncionarioDto, authId: string) {
    this.logger.log(`[FuncionarioService] createFuncionario chamado`, { authId });

    if (createFuncionarioDto.cargo === Cargo.PROPRIETARIO) {
      throw new BadRequestException('Não é possível criar um usuário com cargo PROPRIETARIO por este endpoint.');
    }

    const proprietario = await this.getUserByAuthId(authId);
    const propriedadesDoProprietario = await this.getUserPropriedades(proprietario.idUsuario);

    if (createFuncionarioDto.id_propriedade && !propriedadesDoProprietario.includes(createFuncionarioDto.id_propriedade)) {
      throw new ForbiddenException('Você só pode criar funcionários para suas próprias propriedades.');
    }

    const { data: authUser, error: authError } = await this.adminSupabase.auth.admin.createUser({
      email: createFuncionarioDto.email,
      password: createFuncionarioDto.password,
      email_confirm: true,
      user_metadata: {
        nome: createFuncionarioDto.nome,
        cargo: createFuncionarioDto.cargo,
      },
    });

    if (authError) {
      this.logger.logError(authError, { method: 'createFuncionario', step: 'supabaseAuth' });
      if (authError.message.includes('already exists')) {
        throw new ConflictException('Este email já está registrado no sistema de autenticação.');
      }
      throw new InternalServerErrorException(`Erro ao criar conta de autenticação: ${authError.message}`);
    }

    try {
      const existingUser = await this.usuarioRepository.existePorEmail(createFuncionarioDto.email);

      if (existingUser) {
        throw new ConflictException('Já existe um perfil de usuário com este email.');
      }

      const novoFuncionario = await this.usuarioRepository.criarFuncionario({
        authId: authUser.user.id,
        nome: createFuncionarioDto.nome,
        email: createFuncionarioDto.email,
        telefone: createFuncionarioDto.telefone,
        cargo: createFuncionarioDto.cargo,
        id_endereco: createFuncionarioDto.id_endereco,
      });

      const propriedadesParaVincular = createFuncionarioDto.id_propriedade ? [createFuncionarioDto.id_propriedade] : propriedadesDoProprietario;

      await this.usuarioPropriedadeRepository.vincular(novoFuncionario.idUsuario, propriedadesParaVincular);

      return {
        id_usuario: novoFuncionario.idUsuario,
        auth_id: novoFuncionario.authId,
        nome: novoFuncionario.nome,
        email: novoFuncionario.email,
        telefone: novoFuncionario.telefone,
        cargo: novoFuncionario.cargo,
        id_endereco: novoFuncionario.idEndereco,
        created_at: novoFuncionario.createdAt,
        updated_at: novoFuncionario.updatedAt,
        propriedades_vinculadas: propriedadesParaVincular,
        auth_credentials: {
          email: createFuncionarioDto.email,
          temp_password: createFuncionarioDto.password,
        },
      };
    } catch (error) {
      this.logger.logError(error as Error, { message: 'Erro na transação, realizando rollback do Auth User...', authUserId: authUser.user.id });
      await this.adminSupabase.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }
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

    return { message: 'Funcionário desvinculado com sucesso.' };
  }
}
