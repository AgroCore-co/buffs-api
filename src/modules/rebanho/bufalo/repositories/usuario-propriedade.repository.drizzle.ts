import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { eq, or, isNull } from 'drizzle-orm';
import { usuario, propriedade, usuariopropriedade, grupo } from '../../../../database/schema';

/**
 * Repository para operações auxiliares de usuário e propriedade no contexto de búfalos.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class UsuarioPropriedadeRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca usuário por email
   */
  async buscarUsuarioPorEmail(email: string) {
    try {
      return await this.databaseService.db.query.usuario.findFirst({
        where: eq(usuario.email, email),
        columns: {
          idUsuario: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'UsuarioPropriedadeRepositoryDrizzle',
        method: 'buscarUsuarioPorEmail',
        email,
      });
      throw new InternalServerErrorException(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é dono
   */
  async buscarPropriedadesComoDono(userId: string) {
    try {
      return await this.databaseService.db.query.propriedade.findMany({
        where: eq(propriedade.idDono, userId),
        columns: {
          idPropriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'UsuarioPropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadesComoDono',
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedades como dono: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é funcionário
   */
  async buscarPropriedadesComoFuncionario(userId: string) {
    try {
      return await this.databaseService.db.query.usuariopropriedade.findMany({
        where: eq(usuariopropriedade.idUsuario, userId),
        columns: {
          idPropriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'UsuarioPropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadesComoFuncionario',
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedades como funcionário: ${error.message}`);
    }
  }

  /**
   * Busca propriedade por ID com informação ABCB
   */
  async buscarPropriedadePorId(idPropriedade: string) {
    try {
      return await this.databaseService.db.query.propriedade.findFirst({
        where: eq(propriedade.idPropriedade, idPropriedade),
        columns: {
          idPropriedade: true,
          pAbcb: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'UsuarioPropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadePorId',
        idPropriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedade: ${error.message}`);
    }
  }

  /**
   * Busca grupo por ID e valida se pertence às propriedades do usuário
   */
  async buscarGrupoPorId(idGrupo: string, propriedadesUsuario: string[]) {
    try {
      const grupos = await this.databaseService.db.query.grupo.findMany({
        where: eq(grupo.idGrupo, idGrupo),
        columns: {
          idGrupo: true,
          idPropriedade: true,
        },
      });

      return grupos.find((g) => g.idPropriedade && propriedadesUsuario.includes(g.idPropriedade));
    } catch (error) {
      this.logger.logError(error, {
        repository: 'UsuarioPropriedadeRepositoryDrizzle',
        method: 'buscarGrupoPorId',
        idGrupo,
      });
      throw new InternalServerErrorException(`Erro ao buscar grupo: ${error.message}`);
    }
  }
}
