import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, or, sql } from 'drizzle-orm';
import { usuario, endereco } from '../../../database/schema';
import { CreateUsuarioDto, UpdateUsuarioDto } from '../dto';
import { Cargo } from '../enums/cargo.enum';

const usuarioComEnderecoSelect = {
  usuario: {
    idUsuario: usuario.idUsuario,
    authId: usuario.authId,
    nome: usuario.nome,
    telefone: usuario.telefone,
    email: usuario.email,
    cargo: usuario.cargo,
    idEndereco: usuario.idEndereco,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  },
  endereco: {
    idEndereco: endereco.idEndereco,
    pais: endereco.pais,
    estado: endereco.estado,
    cidade: endereco.cidade,
    bairro: endereco.bairro,
    rua: endereco.rua,
    cep: endereco.cep,
    numero: endereco.numero,
    pontoReferencia: endereco.pontoReferencia,
    createdAt: endereco.createdAt,
    updatedAt: endereco.updatedAt,
  },
};

@Injectable()
export class UsuarioRepositoryDrizzle {
  constructor(private readonly db: DatabaseService) {}

  private montarUsuarioComEndereco(linha: { usuario: any; endereco: any }) {
    const { usuario: usuarioData, endereco: enderecoData } = linha;

    return {
      ...usuarioData,
      endereco: enderecoData?.idEndereco ? enderecoData : null,
    };
  }

  /**
   * Cria um novo usuário (perfil PROPRIETARIO)
   */
  async criar(createUsuarioDto: CreateUsuarioDto, email: string, authId: string) {
    const data = {
      authId,
      nome: createUsuarioDto.nome,
      telefone: createUsuarioDto.telefone,
      email,
      cargo: Cargo.PROPRIETARIO,
      idEndereco: createUsuarioDto.idEndereco,
    };

    const [novoUsuario] = await this.db.db.insert(usuario).values(data).returning();
    return novoUsuario;
  }

  /**
   * Cria um funcionário (GERENTE, FUNCIONARIO, VETERINARIO)
   */
  async criarFuncionario(dados: { authId: string; nome: string; email: string; telefone?: string; cargo: Cargo; id_endereco?: string }) {
    const data = {
      authId: dados.authId,
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      cargo: dados.cargo,
      idEndereco: dados.id_endereco,
    };

    const [novoUsuario] = await this.db.db.insert(usuario).values(data).returning();
    return novoUsuario;
  }

  /**
   * Busca usuário por email
   */
  async buscarPorEmail(email: string) {
    const resultado = await this.db.db
      .select(usuarioComEnderecoSelect)
      .from(usuario)
      .leftJoin(endereco, eq(usuario.idEndereco, endereco.idEndereco))
      .where(eq(usuario.email, email))
      .limit(1);

    if (!resultado || resultado.length === 0) {
      return null;
    }

    return this.montarUsuarioComEndereco(resultado[0]);
  }

  /**
   * Busca usuário por auth_id (Supabase Auth ID)
   */
  async buscarPorAuthId(authId: string) {
    const resultado = await this.db.db.select().from(usuario).where(eq(usuario.authId, authId)).limit(1);

    if (!resultado || resultado.length === 0) {
      return null;
    }

    return resultado[0];
  }

  /**
   * Busca usuário por ID
   */
  async buscarPorId(idUsuario: string) {
    const resultado = await this.db.db
      .select(usuarioComEnderecoSelect)
      .from(usuario)
      .leftJoin(endereco, eq(usuario.idEndereco, endereco.idEndereco))
      .where(eq(usuario.idUsuario, idUsuario))
      .limit(1);

    if (!resultado || resultado.length === 0) {
      return null;
    }

    return this.montarUsuarioComEndereco(resultado[0]);
  }

  /**
   * Verifica se já existe usuário com email ou auth_id
   */
  async existePorEmailOuAuthId(email: string, authId: string) {
    const resultado = await this.db.db
      .select({ id_usuario: usuario.idUsuario })
      .from(usuario)
      .where(or(eq(usuario.email, email), eq(usuario.authId, authId)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Verifica se já existe usuário com email
   */
  async existePorEmail(email: string) {
    const resultado = await this.db.db.select({ id_usuario: usuario.idUsuario }).from(usuario).where(eq(usuario.email, email)).limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Lista todos os usuários
   */
  async listarTodos() {
    const resultado = await this.db.db.select(usuarioComEnderecoSelect).from(usuario).leftJoin(endereco, eq(usuario.idEndereco, endereco.idEndereco));

    return resultado.map((linha) => this.montarUsuarioComEndereco(linha));
  }

  /**
   * Atualiza um usuário
   */
  async atualizar(idUsuario: string, updateUsuarioDto: UpdateUsuarioDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateUsuarioDto.nome !== undefined) {
      data.nome = updateUsuarioDto.nome;
    }
    if (updateUsuarioDto.telefone !== undefined) {
      data.telefone = updateUsuarioDto.telefone;
    }
    if (updateUsuarioDto.idEndereco !== undefined) {
      data.idEndereco = updateUsuarioDto.idEndereco;
    }

    const [usuarioAtualizado] = await this.db.db.update(usuario).set(data).where(eq(usuario.idUsuario, idUsuario)).returning();

    return usuarioAtualizado;
  }

  /**
   * Remove um usuário
   */
  async remover(idUsuario: string) {
    const resultado = await this.db.db.delete(usuario).where(eq(usuario.idUsuario, idUsuario)).returning({ id_usuario: usuario.idUsuario });

    return resultado.length > 0;
  }

  /**
   * Atualiza apenas o cargo de um usuário
   */
  async atualizarCargo(idUsuario: string, novoCargo: Cargo) {
    const [usuarioAtualizado] = await this.db.db
      .update(usuario)
      .set({
        cargo: novoCargo,
        updatedAt: sql`now()`,
      })
      .where(eq(usuario.idUsuario, idUsuario))
      .returning();

    return usuarioAtualizado;
  }
}
