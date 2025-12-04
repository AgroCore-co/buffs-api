import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, count, sql } from 'drizzle-orm';
import { alimentacaodef } from 'src/database/schema';

/**
 * Repository Drizzle para alimentacaodef (Definições de Alimentação)
 */
@Injectable()
export class AlimentacaoDefRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria nova definição de alimentação
   */
  async create(data: any) {
    try {
      const result = await this.databaseService.db.insert(alimentacaodef).values(data).returning();

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca todas as definições de alimentação com paginação
   */
  async findAll(limit: number, offset: number) {
    try {
      const result = await this.databaseService.db.query.alimentacaodef.findMany({
        orderBy: (alimentacaodef, { asc }) => [asc(alimentacaodef.idAlimentDef)],
        limit,
        offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta total de definições de alimentação
   */
  async countAll() {
    try {
      const result = await this.databaseService.db.select({ count: count() }).from(alimentacaodef);

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca definições de alimentação por propriedade com paginação
   */
  async findByPropriedade(idPropriedade: string, limit: number, offset: number) {
    try {
      const result = await this.databaseService.db.query.alimentacaodef.findMany({
        where: eq(alimentacaodef.idPropriedade, idPropriedade),
        orderBy: (alimentacaodef, { asc, desc }) => [asc(alimentacaodef.tipoAlimentacao), desc(alimentacaodef.createdAt)],
        limit,
        offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta definições de alimentação por propriedade
   */
  async countByPropriedade(idPropriedade: string) {
    try {
      const result = await this.databaseService.db
        .select({ count: count() })
        .from(alimentacaodef)
        .where(eq(alimentacaodef.idPropriedade, idPropriedade));

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca definição de alimentação por ID
   */
  async findOne(idAlimentDef: string) {
    try {
      const result = await this.databaseService.db.query.alimentacaodef.findFirst({
        where: eq(alimentacaodef.idAlimentDef, idAlimentDef),
      });

      if (!result) {
        return { data: null, error: { message: 'Definição de alimentação não encontrada' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Atualiza definição de alimentação
   */
  async update(idAlimentDef: string, data: any) {
    try {
      const result = await this.databaseService.db.update(alimentacaodef).set(data).where(eq(alimentacaodef.idAlimentDef, idAlimentDef)).returning();

      if (!result || result.length === 0) {
        return { data: null, error: { message: 'Definição de alimentação não encontrada' } };
      }

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Remove definição de alimentação
   */
  async remove(idAlimentDef: string) {
    try {
      await this.databaseService.db.delete(alimentacaodef).where(eq(alimentacaodef.idAlimentDef, idAlimentDef));

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
