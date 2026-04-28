import { Injectable, BadRequestException, ConflictException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuarioRepositoryDrizzle } from '../usuario/repositories/usuario.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from '../usuario/repositories/usuario-propriedade.repository.drizzle';
import { LoggerService } from '../../core/logger/logger.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AuthHelperService } from '../../core/services/auth-helper.service';
import { SignUpProprietarioDto } from './dto/signup-proprietario.dto';
import { SignUpFuncionarioDto } from './dto/signup-funcionario.dto';
import { Cargo } from '../usuario/enums/cargo.enum';
import { formatDateFields } from '../../core/utils/date-formatter.utils';

/**
 * Facade Service para orquestrar fluxos completos de registro
 * Garante atomicidade: se auth falhar, não cria perfil
 */
@Injectable()
export class AuthFacadeService {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioRepository: UsuarioRepositoryDrizzle,
    private readonly usuarioPropriedadeRepository: UsuarioPropriedadeRepositoryDrizzle,
    private readonly supabaseService: SupabaseService,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Registra um proprietário: cria conta Supabase Auth + perfil no banco
   * Fluxo atômico: se qualquer etapa falhar, rollback é automático
   */
  async registerProprietario(dto: SignUpProprietarioDto) {
    this.logger.log('[AuthFacade] Iniciando registro de proprietário', { email: dto.email });

    // 1. Verificar se usuário já existe no banco
    const existingUser = await this.usuarioRepository.existePorEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    // 2. Criar conta no Supabase Auth (pode falhar por email duplicado no auth)
    let authResult;
    try {
      authResult = await this.authService.signUp(dto.email, dto.password, {
        nome: dto.nome,
        telefone: dto.telefone,
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'AuthFacade',
        method: 'registerProprietario',
        context: 'supabase_auth_signup',
      });
      throw new BadRequestException(error.message || 'Erro ao criar conta de autenticação');
    }

    // 3. Criar perfil no banco (rollback automático se falhar)
    try {
      const perfil = await this.usuarioRepository.criar(
        {
          nome: dto.nome,
          telefone: dto.telefone,
          idEndereco: dto.idEndereco,
          cargo: Cargo.PROPRIETARIO,
        },
        dto.email,
        authResult.user.id,
      );

      this.logger.log('[AuthFacade] Proprietário registrado com sucesso', {
        userId: perfil.idUsuario,
        email: dto.email,
      });

      return {
        message: 'Proprietário registrado com sucesso. Verifique seu email para confirmar a conta.',
        user: formatDateFields(perfil),
        session: authResult.session,
      };
    } catch (error) {
      // Rollback: deletar conta do Supabase Auth se criar perfil falhar
      this.logger.logError(error, {
        module: 'AuthFacade',
        method: 'registerProprietario',
        context: 'criar_perfil_rollback',
        authId: authResult.user.id,
      });

      try {
        await this.supabaseService.getAdminClient().auth.admin.deleteUser(authResult.user.id);
        this.logger.log('[AuthFacade] Rollback: conta de autenticação deletada', { authId: authResult.user.id });
      } catch (rollbackError) {
        this.logger.logError(rollbackError, {
          module: 'AuthFacade',
          method: 'registerProprietario',
          context: 'rollback_falhou',
        });
      }

      throw new InternalServerErrorException('Erro ao criar perfil. Tente novamente.');
    }
  }

  /**
   * Registra um funcionário: cria conta Supabase Auth + perfil + vincula propriedades
   * @param dto Dados do funcionário
   * @param authIdProprietario auth_id do proprietário que está criando
   */
  async registerFuncionario(dto: SignUpFuncionarioDto, authIdProprietario: string) {
    this.logger.log('[AuthFacade] Iniciando registro de funcionário', {
      email: dto.email,
      cargo: dto.cargo,
      proprietarioAuthId: authIdProprietario,
    });

    // 1. Buscar solicitante autenticado e suas propriedades
    const proprietario = await this.usuarioRepository.buscarPorAuthId(authIdProprietario);
    if (!proprietario) {
      throw new ForbiddenException('Perfil local do solicitante não encontrado.');
    }

    let propriedadesDoSolicitante: string[] = [];
    try {
      // Usa AuthHelper para cobrir propriedades como dono e como funcionário (ex.: GERENTE).
      propriedadesDoSolicitante = await this.authHelper.getUserPropriedades(proprietario.idUsuario);
    } catch (error) {
      this.logger.logError(error, {
        module: 'AuthFacade',
        method: 'registerFuncionario',
        context: 'resolver_propriedades_solicitante',
        solicitanteId: proprietario.idUsuario,
      });
      throw new BadRequestException('Você precisa ter ao menos uma propriedade cadastrada para criar funcionários');
    }

    if (propriedadesDoSolicitante.length === 0) {
      throw new BadRequestException('Você precisa ter ao menos uma propriedade cadastrada para criar funcionários');
    }

    // 2. Validar propriedade específica se fornecida
    if (dto.idPropriedade && !propriedadesDoSolicitante.includes(dto.idPropriedade)) {
      throw new BadRequestException('Propriedade não pertence a você');
    }

    // 3. Verificar duplicação
    const existingUser = await this.usuarioRepository.existePorEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado no sistema');
    }

    // 4. Criar conta no Supabase Auth
    let authResult;
    try {
      authResult = await this.authService.signUp(dto.email, dto.password, {
        nome: dto.nome,
        telefone: dto.telefone,
        cargo: dto.cargo,
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'AuthFacade',
        method: 'registerFuncionario',
        context: 'supabase_auth_signup',
      });
      throw new BadRequestException(error.message || 'Erro ao criar conta de autenticação');
    }

    // 5. Criar perfil + vincular propriedades (transação implícita)
    try {
      const perfil = await this.usuarioRepository.criarFuncionario({
        authId: authResult.user.id,
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        cargo: dto.cargo,
        id_endereco: dto.idEndereco,
      });

      // Vincular à propriedade específica ou a todas do proprietário
      const propriedadesVinculadas = dto.idPropriedade ? [dto.idPropriedade] : propriedadesDoSolicitante;

      await this.usuarioPropriedadeRepository.vincular(perfil.idUsuario, propriedadesVinculadas);
      await this.authHelper.invalidarCachePropriedades(perfil.idUsuario);

      this.logger.log('[AuthFacade] Funcionário registrado com sucesso', {
        userId: perfil.idUsuario,
        email: dto.email,
        propriedades: propriedadesVinculadas.length,
      });

      return {
        message: 'Funcionário registrado com sucesso.',
        user: formatDateFields(perfil),
        propriedades_vinculadas: propriedadesVinculadas,
      };
    } catch (error) {
      // Rollback: deletar conta do Supabase Auth
      this.logger.logError(error, {
        module: 'AuthFacade',
        method: 'registerFuncionario',
        context: 'criar_perfil_rollback',
        authId: authResult.user.id,
      });

      try {
        await this.supabaseService.getAdminClient().auth.admin.deleteUser(authResult.user.id);
        this.logger.log('[AuthFacade] Rollback: conta de autenticação deletada', { authId: authResult.user.id });
      } catch (rollbackError) {
        this.logger.logError(rollbackError, {
          module: 'AuthFacade',
          method: 'registerFuncionario',
          context: 'rollback_falhou',
        });
      }

      throw new InternalServerErrorException('Erro ao criar perfil de funcionário. Tente novamente.');
    }
  }
}
