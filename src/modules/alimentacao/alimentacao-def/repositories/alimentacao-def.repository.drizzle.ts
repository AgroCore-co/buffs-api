import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, count, isNull, and, asc, desc } from 'drizzle-orm';
import { alimentacaodef } from 'src/database/schema';

/**
 * Repository Drizzle para alimentacaodef (Definições de Alimentação)
 */
@Injectable()
export class AlimentacaoDefRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria nova definição de alimentação
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async create(data: any) {
    try {
      const mappedData = {
        idPropriedade: data.id_propriedade,
        tipoAlimentacao: data.tipo_alimentacao,
        descricao: data.descricao,
      };

      const result = await this.databaseService.db.insert(alimentacaodef).values(mappedData).returning();

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
        where: isNull(alimentacaodef.deletedAt),
        orderBy: [asc(alimentacaodef.tipoAlimentacao)],
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
      const result = await this.databaseService.db.select({ count: count() }).from(alimentacaodef).where(isNull(alimentacaodef.deletedAt));

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
        where: and(eq(alimentacaodef.idPropriedade, idPropriedade), isNull(alimentacaodef.deletedAt)),
        orderBy: [asc(alimentacaodef.tipoAlimentacao), desc(alimentacaodef.createdAt)],
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
        .where(and(eq(alimentacaodef.idPropriedade, idPropriedade), isNull(alimentacaodef.deletedAt)));

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
        where: and(eq(alimentacaodef.idAlimentDef, idAlimentDef), isNull(alimentacaodef.deletedAt)),
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
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async update(idAlimentDef: string, data: any) {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Mapeia snake_case para camelCase
      if (data.tipo_alimentacao) updateData.tipoAlimentacao = data.tipo_alimentacao;
      if (data.descricao !== undefined) updateData.descricao = data.descricao;

      const result = await this.databaseService.db
        .update(alimentacaodef)
        .set(updateData)
        .where(and(eq(alimentacaodef.idAlimentDef, idAlimentDef), isNull(alimentacaodef.deletedAt)))
        .returning();

      if (!result || result.length === 0) {
        return { data: null, error: { message: 'Definição de alimentação não encontrada' } };
      }

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Remove definição de alimentação (soft delete)
   */
  async remove(idAlimentDef: string) {
    try {
      const result = await this.databaseService.db
        .update(alimentacaodef)
        .set({ deletedAt: new Date().toISOString() })
        .where(and(eq(alimentacaodef.idAlimentDef, idAlimentDef), isNull(alimentacaodef.deletedAt)))
        .returning();

      if (!result || result.length === 0) {
        return { data: null, error: { message: 'Definição de alimentação não encontrada' } };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
