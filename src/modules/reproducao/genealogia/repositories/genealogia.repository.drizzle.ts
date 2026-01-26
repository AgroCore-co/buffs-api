import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, or } from 'drizzle-orm';
import { bufalo } from '../../../../database/schema';

/**
 * Repository para queries de genealogia usando Drizzle ORM.
 *
 * **Responsabilidades:**
 * - Executar queries recursivas de árvore genealógica
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class GenealogiaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Busca búfalo por ID com informações de raça
   */
  async findBufaloById(idBufalo: string) {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: eq(bufalo.idBufalo, idBufalo),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalo: ${error.message}`);
    }
  }

  /**
   * Busca búfalo apenas com IDs de pai e mãe (para recursão)
   */
  async findBufaloWithParents(idBufalo: string) {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: eq(bufalo.idBufalo, idBufalo),
        columns: {
          idBufalo: true,
          idRaca: true,
          categoria: true,
          nome: true,
          idPai: true,
          idMae: true,
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalo com pais: ${error.message}`);
    }
  }

  /**
   * Verifica se búfalo pertence a propriedades do usuário
   */
  async verificarPropriedadeUsuario(idBufalo: string, propriedadesUsuario: string[]): Promise<boolean> {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: and(eq(bufalo.idBufalo, idBufalo), or(...propriedadesUsuario.map((id) => eq(bufalo.idPropriedade, id)))),
        columns: {
          idBufalo: true,
        },
      });

      return !!result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao verificar propriedade: ${error.message}`);
    }
  }

  /**
   * Verifica se um búfalo tem descendentes (é pai ou mãe)
   */
  async verificarDescendentes(idBufalo: string): Promise<boolean> {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: or(eq(bufalo.idPai, idBufalo), eq(bufalo.idMae, idBufalo)),
        columns: {
          idBufalo: true,
        },
      });

      return !!result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao verificar descendentes: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é dono
   */
  async buscarPropriedadesComoDono(userId: string) {
    try {
      const db = this.databaseService.db;
      const { propriedade } = await import('../../../../database/schema');

      const result = await db.query.propriedade.findMany({
        where: eq(propriedade.idDono, userId),
        columns: {
          idPropriedade: true,
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar propriedades: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é funcionário
   */
  async buscarPropriedadesComoFuncionario(userId: string) {
    try {
      const db = this.databaseService.db;
      const { usuariopropriedade, propriedade } = await import('../../../../database/schema');

      const result = await db
        .select({
          idPropriedade: propriedade.idPropriedade,
        })
        .from(usuariopropriedade)
        .innerJoin(propriedade, eq(usuariopropriedade.idPropriedade, propriedade.idPropriedade))
        .where(eq(usuariopropriedade.idUsuario, userId));

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar propriedades como funcionário: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email
   */
  async buscarUsuarioPorEmail(email: string) {
    try {
      const db = this.databaseService.db;
      const { usuario } = await import('../../../../database/schema');

      const result = await db.query.usuario.findFirst({
        where: eq(usuario.email, email),
        columns: {
          idUsuario: true,
          email: true,
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar usuário: ${error.message}`);
    }
  }
}
