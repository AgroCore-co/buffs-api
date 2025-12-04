import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, desc, count } from 'drizzle-orm';
import { alimregistro, alimentacaodef, grupo, usuario } from 'src/database/schema';

/**
 * Repository Drizzle para alimregistro (Registros de Alimentação)
 */
@Injectable()
export class RegistrosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo registro de alimentação
   */
  async create(data: any) {
    try {
      const result = await this.databaseService.db.insert(alimregistro).values(data).returning();

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca todos os registros de alimentação com paginação
   */
  async findAll(limit: number, offset: number) {
    try {
      const result = await this.databaseService.db.query.alimregistro.findMany({
        orderBy: (alimregistro, { desc }) => [desc(alimregistro.createdAt)],
        limit,
        offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta total de registros de alimentação
   */
  async countAll() {
    try {
      const result = await this.databaseService.db.select({ count: count() }).from(alimregistro);

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca registros de alimentação por propriedade com relações e paginação
   */
  async findByPropriedade(idPropriedade: string, limit: number, offset: number) {
    try {
      const result = await this.databaseService.db.query.alimregistro.findMany({
        where: eq(alimregistro.idPropriedade, idPropriedade),
        with: {
          alimentacaodef: {
            columns: {
              tipoAlimentacao: true,
              descricao: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          usuario: {
            columns: {
              nome: true,
            },
          },
        },
        orderBy: (alimregistro, { desc }) => [desc(alimregistro.dtRegistro), desc(alimregistro.createdAt)],
        limit,
        offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta registros de alimentação por propriedade
   */
  async countByPropriedade(idPropriedade: string) {
    try {
      const result = await this.databaseService.db.select({ count: count() }).from(alimregistro).where(eq(alimregistro.idPropriedade, idPropriedade));

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca registro de alimentação por ID
   */
  async findOne(idRegistro: string) {
    try {
      const result = await this.databaseService.db.query.alimregistro.findFirst({
        where: eq(alimregistro.idRegistro, idRegistro),
      });

      if (!result) {
        return { data: null, error: { message: 'Registro de alimentação não encontrado' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Atualiza registro de alimentação
   */
  async update(idRegistro: string, data: any) {
    try {
      const result = await this.databaseService.db.update(alimregistro).set(data).where(eq(alimregistro.idRegistro, idRegistro)).returning();

      if (!result || result.length === 0) {
        return { data: null, error: { message: 'Registro de alimentação não encontrado' } };
      }

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Remove registro de alimentação
   */
  async remove(idRegistro: string) {
    try {
      await this.databaseService.db.delete(alimregistro).where(eq(alimregistro.idRegistro, idRegistro));

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca grupo por ID (para validação)
   */
  async findGrupoById(idGrupo: string) {
    try {
      const result = await this.databaseService.db.query.grupo.findFirst({
        where: eq(grupo.idGrupo, idGrupo),
        columns: {
          idPropriedade: true,
        },
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca definição de alimentação por ID (para validação)
   */
  async findAlimentDefById(idAlimentDef: string) {
    try {
      const result = await this.databaseService.db.query.alimentacaodef.findFirst({
        where: eq(alimentacaodef.idAlimentDef, idAlimentDef),
        columns: {
          idPropriedade: true,
        },
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
