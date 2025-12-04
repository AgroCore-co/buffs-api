import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, desc, count, isNull } from 'drizzle-orm';
import { materialgenetico } from '../../../../database/schema';

/**
 * Repository para queries de material genético usando Drizzle ORM.
 *
 * **Responsabilidades:**
 * - Executar queries CRUD no PostgreSQL via Drizzle
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class MaterialGeneticoRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo material genético
   */
  async create(data: any) {
    try {
      const db = this.databaseService.db;
      const result = await db.insert(materialgenetico).values(data).returning();
      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar material genético: ${error.message}`);
    }
  }

  /**
   * Busca todos os materiais genéticos com paginação
   */
  async findAll(offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      const [data, totalResult] = await Promise.all([
        db.query.materialgenetico.findMany({
          where: isNull(materialgenetico.deletedAt),
          orderBy: [desc(materialgenetico.createdAt)],
          limit,
          offset,
        }),
        db.select({ count: count() }).from(materialgenetico).where(isNull(materialgenetico.deletedAt)),
      ]);

      return {
        data,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar materiais genéticos: ${error.message}`);
    }
  }

  /**
   * Busca materiais genéticos por propriedade com paginação
   */
  async findByPropriedade(idPropriedade: string, offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      const [data, totalResult] = await Promise.all([
        db.query.materialgenetico.findMany({
          where: and(eq(materialgenetico.idPropriedade, idPropriedade), isNull(materialgenetico.deletedAt)),
          orderBy: [desc(materialgenetico.createdAt)],
          limit,
          offset,
        }),
        db
          .select({ count: count() })
          .from(materialgenetico)
          .where(and(eq(materialgenetico.idPropriedade, idPropriedade), isNull(materialgenetico.deletedAt))),
      ]);

      return {
        data,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar materiais por propriedade: ${error.message}`);
    }
  }

  /**
   * Busca material genético por ID
   */
  async findById(idMaterial: string) {
    try {
      const result = await this.databaseService.db.query.materialgenetico.findFirst({
        where: and(eq(materialgenetico.idMaterial, idMaterial), isNull(materialgenetico.deletedAt)),
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar material genético: ${error.message}`);
    }
  }

  /**
   * Atualiza material genético
   */
  async update(idMaterial: string, data: any) {
    try {
      const db = this.databaseService.db;

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await db.update(materialgenetico).set(updateData).where(eq(materialgenetico.idMaterial, idMaterial)).returning();

      return result[0] || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar material genético: ${error.message}`);
    }
  }

  /**
   * Soft delete: marca material como removido
   */
  async softDelete(idMaterial: string) {
    try {
      const db = this.databaseService.db;

      const result = await db
        .update(materialgenetico)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(materialgenetico.idMaterial, idMaterial))
        .returning();

      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao remover material genético: ${error.message}`);
    }
  }

  /**
   * Restaura material genético removido
   */
  async restore(idMaterial: string) {
    try {
      const db = this.databaseService.db;

      const result = await db.update(materialgenetico).set({ deletedAt: null }).where(eq(materialgenetico.idMaterial, idMaterial)).returning();

      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar material genético: ${error.message}`);
    }
  }

  /**
   * Busca todos os materiais incluindo removidos
   */
  async findAllWithDeleted() {
    try {
      const result = await this.databaseService.db.query.materialgenetico.findMany({
        orderBy: [desc(materialgenetico.deletedAt), desc(materialgenetico.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar materiais: ${error.message}`);
    }
  }
}
