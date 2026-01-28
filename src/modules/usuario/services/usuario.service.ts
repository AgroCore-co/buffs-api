import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Cargo } from '../enums/cargo.enum';
import { LoggerService } from 'src/core/logger/logger.service';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { UsuarioRepositoryDrizzle, UsuarioPropriedadeRepositoryDrizzle, PropriedadeRepositoryHelper } from '../repositories';

@Injectable()
export class UsuarioService {
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
   * Cria um novo perfil de usuário PROPRIETARIO.
   * @param createUsuarioDto Dados para o novo perfil.
   * @param email Email extraído do JWT.
   * @param authId O auth_id (UUID) do Supabase extraído do JWT.
   * @returns O perfil do usuário recém-criado.
   */
  async create(createUsuarioDto: CreateUsuarioDto, email: string, authId: string) {
    this.logger.log(`[UsuarioService] create chamado`, { email, authId });

    const existingProfile = await this.usuarioRepository.existePorEmailOuAuthId(email, authId);

    if (existingProfile) {
      this.logger.warn(`[UsuarioService] Tentativa de criar perfil duplicado`, { email });
      throw new ConflictException('Este usuário já possui um perfil cadastrado.');
    }

    const novoUsuario = await this.usuarioRepository.criar(createUsuarioDto, email, authId);

    return {
      id_usuario: novoUsuario.idUsuario,
      auth_id: novoUsuario.authId,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      telefone: novoUsuario.telefone,
      cargo: novoUsuario.cargo,
      id_endereco: novoUsuario.idEndereco,
      created_at: novoUsuario.createdAt,
      updated_at: novoUsuario.updatedAt,
    };
  }

  /**
   * Retorna uma lista de todos os usuários.
   */
  async findAll() {
    this.logger.log(`[UsuarioService] findAll chamado`);

    const usuarios = await this.usuarioRepository.listarTodos();

    return usuarios.map((usuario) => ({
      id_usuario: usuario.idUsuario,
      auth_id: usuario.authId,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      id_endereco: usuario.idEndereco,
      created_at: usuario.createdAt,
      updated_at: usuario.updatedAt,
      endereco: usuario.endereco
        ? {
            id_endereco: usuario.endereco.idEndereco,
            estado: usuario.endereco.estado,
            cidade: usuario.endereco.cidade,
            bairro: usuario.endereco.bairro,
            rua: usuario.endereco.rua,
            numero: usuario.endereco.numero,
            cep: usuario.endereco.cep,
            ponto_referencia: usuario.endereco.pontoReferencia,
          }
        : null,
    }));
  }

  /**
   * Encontra um perfil de usuário usando seu email.
   * @param email O email do usuário.
   */
  async findOneByEmail(email: string) {
    this.logger.log(`[UsuarioService] findOneByEmail chamado`, { email });

    const usuario = await this.usuarioRepository.buscarPorEmail(email);

    if (!usuario) {
      throw new NotFoundException(`Nenhum perfil de usuário encontrado para o email: ${email}`);
    }

    return {
      id_usuario: usuario.idUsuario,
      auth_id: usuario.authId,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      id_endereco: usuario.idEndereco,
      created_at: usuario.createdAt,
      updated_at: usuario.updatedAt,
      endereco: usuario.endereco
        ? {
            id_endereco: usuario.endereco.idEndereco,
            estado: usuario.endereco.estado,
            cidade: usuario.endereco.cidade,
            bairro: usuario.endereco.bairro,
            rua: usuario.endereco.rua,
            numero: usuario.endereco.numero,
            cep: usuario.endereco.cep,
            ponto_referencia: usuario.endereco.pontoReferencia,
          }
        : null,
    };
  }

  /**
   * Encontra um usuário pela sua chave primária (id_usuario UUID).
   * @param id O ID UUID do usuário.
   */
  async findOne(id: string) {
    this.logger.log(`[UsuarioService] findOne chamado`, { id });

    const usuario = await this.usuarioRepository.buscarPorId(id);

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return {
      id_usuario: usuario.idUsuario,
      auth_id: usuario.authId,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      id_endereco: usuario.idEndereco,
      created_at: usuario.createdAt,
      updated_at: usuario.updatedAt,
      endereco: usuario.endereco
        ? {
            id_endereco: usuario.endereco.idEndereco,
            estado: usuario.endereco.estado,
            cidade: usuario.endereco.cidade,
            bairro: usuario.endereco.bairro,
            rua: usuario.endereco.rua,
            numero: usuario.endereco.numero,
            cep: usuario.endereco.cep,
            ponto_referencia: usuario.endereco.pontoReferencia,
          }
        : null,
    };
  }

  /**
   * Atualiza os dados de um usuário.
   * @param id O ID UUID do usuário.
   * @param updateUsuarioDto Os dados a serem atualizados.
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    this.logger.log(`[UsuarioService] update chamado`, { id, updateUsuarioDto });

    const usuarioAtualizado = await this.usuarioRepository.atualizar(id, updateUsuarioDto);

    if (!usuarioAtualizado) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado para atualização.`);
    }

    return {
      id_usuario: usuarioAtualizado.idUsuario,
      auth_id: usuarioAtualizado.authId,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      telefone: usuarioAtualizado.telefone,
      cargo: usuarioAtualizado.cargo,
      id_endereco: usuarioAtualizado.idEndereco,
      created_at: usuarioAtualizado.createdAt,
      updated_at: usuarioAtualizado.updatedAt,
    };
  }

  /**
   * Remove um usuário.
   * @param id O ID UUID do usuário.
   */
  async remove(id: string) {
    this.logger.log(`[UsuarioService] remove chamado`, { id });

    const removido = await this.usuarioRepository.remover(id);

    if (!removido) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado para remoção.`);
    }

    return { message: `Usuário com ID ${id} deletado com sucesso.` };
  }

  /**
   * Busca todas as propriedades onde o usuário é o dono.
   * @param userId ID UUID do usuário proprietário.
   */
  async getUserPropriedades(userId: string): Promise<string[]> {
    this.logger.log(`[UsuarioService] getUserPropriedades chamado`, { userId });

    const propriedades = await this.propriedadeRepository.listarPorDono(userId);

    if (propriedades.length === 0) {
      this.logger.warn(`[UsuarioService] Usuário não possui nenhuma propriedade`, { userId });
      throw new NotFoundException('Usuário não possui nenhuma propriedade cadastrada.');
    }

    return propriedades;
  }

  /**
   * Cria um funcionário/gerente/veterinário usando o client admin (service role),
   * e vincula à propriedade informada ou às propriedades do solicitante.
   */
  async createFuncionario(
    dto: {
      nome: string;
      email: string;
      password: string;
      telefone?: string;
      cargo: Cargo;
      id_endereco?: string;
      id_propriedade?: string;
    },
    solicitante: { id_usuario?: string; cargo?: Cargo },
  ) {
    this.logger.log('[UsuarioService] createFuncionario chamado', {
      dtoEmail: dto.email,
      solicitante: solicitante?.id_usuario,
    });

    if (!solicitante?.id_usuario) {
      throw new ForbiddenException('Solicitante inválido.');
    }

    if (solicitante.cargo !== Cargo.PROPRIETARIO && solicitante.cargo !== Cargo.GERENTE) {
      throw new ForbiddenException('Apenas PROPRIETARIO ou GERENTE podem criar funcionários.');
    }

    if (dto.cargo === Cargo.PROPRIETARIO) {
      throw new ForbiddenException('Não é permitido criar usuário com cargo PROPRIETARIO por este endpoint.');
    }

    // 1) Criar o usuário no Auth
    const { data: created, error: authErr } = await this.adminSupabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { nome: dto.nome, telefone: dto.telefone },
    });

    if (authErr) {
      this.logger.logError(authErr, { method: 'createFuncionario.auth', email: dto.email });
      throw new InternalServerErrorException(`Erro Auth: ${authErr.message}`);
    }

    const authId = created.user?.id as string;

    // 2) Inserir o perfil na tabela Usuario
    const perfil = await this.usuarioRepository.criarFuncionario({
      authId,
      nome: dto.nome,
      email: dto.email,
      telefone: dto.telefone,
      cargo: dto.cargo,
      id_endereco: dto.id_endereco,
    });

    // 3) Vincular à propriedade
    const propriedadesParaVincular: string[] = [];
    if (dto.id_propriedade) {
      propriedadesParaVincular.push(dto.id_propriedade);
    } else {
      const doSolicitante = await this.getUserPropriedades(solicitante.id_usuario);
      propriedadesParaVincular.push(...doSolicitante);
    }

    await this.usuarioPropriedadeRepository.vincular(perfil.idUsuario, propriedadesParaVincular);

    return {
      id_usuario: perfil.idUsuario,
      auth_id: perfil.authId,
      nome: perfil.nome,
      email: perfil.email,
      telefone: perfil.telefone,
      cargo: perfil.cargo,
      id_endereco: perfil.idEndereco,
      created_at: perfil.createdAt,
      updated_at: perfil.updatedAt,
    };
  }

  /**
   * Atualiza o cargo de um funcionário
   * ⚠️ Não permite mudança para/de PROPRIETARIO (regra de negócio)
   *
   * @param userId ID do usuário a ser atualizado
   * @param novoCargo Novo cargo (GERENTE, FUNCIONARIO ou VETERINARIO)
   * @param solicitante Usuário que está fazendo a requisição (deve ser PROPRIETARIO ou GERENTE)
   */
  async updateCargo(userId: string, novoCargo: Cargo, solicitante: { id_usuario?: string; cargo?: Cargo }) {
    this.logger.log('[UsuarioService] updateCargo chamado', {
      userId,
      novoCargo,
      solicitante: solicitante?.id_usuario,
    });

    // Validação de permissão
    if (!solicitante?.id_usuario || !solicitante?.cargo) {
      throw new ForbiddenException('Solicitante inválido.');
    }

    if (solicitante.cargo !== Cargo.PROPRIETARIO && solicitante.cargo !== Cargo.GERENTE) {
      throw new ForbiddenException('Apenas PROPRIETARIO ou GERENTE podem alterar cargos.');
    }

    // Validação de cargo permitido
    const cargosPermitidos = [Cargo.GERENTE, Cargo.FUNCIONARIO, Cargo.VETERINARIO];
    if (!cargosPermitidos.includes(novoCargo)) {
      throw new BadRequestException('Cargo deve ser GERENTE, FUNCIONARIO ou VETERINARIO.');
    }

    // Busca o usuário a ser atualizado
    const usuario = await this.usuarioRepository.buscarPorId(userId);
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado.`);
    }

    // Não permite alterar cargo de PROPRIETARIO
    if (usuario.cargo === Cargo.PROPRIETARIO) {
      throw new ForbiddenException('Não é permitido alterar o cargo de um PROPRIETARIO.');
    }

    // Se já tem o mesmo cargo, não faz nada
    if (usuario.cargo === novoCargo) {
      this.logger.log('[UsuarioService] Usuário já possui este cargo', { userId, cargo: novoCargo });
      return {
        id_usuario: usuario.idUsuario,
        cargo: usuario.cargo,
        message: 'Usuário já possui este cargo.',
      };
    }

    // Atualiza o cargo
    const atualizado = await this.usuarioRepository.atualizarCargo(userId, novoCargo);

    return {
      id_usuario: atualizado.idUsuario,
      auth_id: atualizado.authId,
      nome: atualizado.nome,
      email: atualizado.email,
      telefone: atualizado.telefone,
      cargo: atualizado.cargo,
      id_endereco: atualizado.idEndereco,
      created_at: atualizado.createdAt,
      updated_at: atualizado.updatedAt,
    };
  }
}
