import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, desc, count, isNull } from 'drizzle-orm';
import { dadosreproducao, bufalo } from '../../../../database/schema';

/**
 * Repository para queries de coberturas usando Drizzle ORM.
 *
 * **Responsabilidades:**
 * - Executar queries CRUD no PostgreSQL via Drizzle
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class CoberturaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria nova cobertura
   */
  async create(data: any) {
    try {
      const db = this.databaseService.db;
      const result = await db.insert(dadosreproducao).values(data).returning();
      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar cobertura: ${error.message}`);
    }
  }

  /**
   * Busca todas as coberturas com paginação
   */
  async findAll(offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      const [data, totalResult] = await Promise.all([
        db.query.dadosreproducao.findMany({
          where: isNull(dadosreproducao.deletedAt),
          orderBy: [desc(dadosreproducao.dtEvento)],
          limit,
          offset,
          with: {
            bufalo_idBufala: {
              columns: {
                idBufalo: true,
                nome: true,
                brinco: true,
                microchip: true,
              },
            },
            bufalo_idBufalo: {
              columns: {
                idBufalo: true,
                nome: true,
                brinco: true,
                microchip: true,
              },
            },
          },
        }),
        db.select({ count: count() }).from(dadosreproducao).where(isNull(dadosreproducao.deletedAt)),
      ]);

      return {
        data,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar coberturas: ${error.message}`);
    }
  }

  /**
   * Busca coberturas por propriedade com paginação
   */
  async findByPropriedade(idPropriedade: string, offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      const [data, totalResult] = await Promise.all([
        db.query.dadosreproducao.findMany({
          where: and(eq(dadosreproducao.idPropriedade, idPropriedade), isNull(dadosreproducao.deletedAt)),
          orderBy: [desc(dadosreproducao.dtEvento)],
          limit,
          offset,
          with: {
            bufalo_idBufala: {
              columns: {
                idBufalo: true,
                nome: true,
                brinco: true,
                microchip: true,
              },
            },
            bufalo_idBufalo: {
              columns: {
                idBufalo: true,
                nome: true,
                brinco: true,
                microchip: true,
              },
            },
          },
        }),
        db
          .select({ count: count() })
          .from(dadosreproducao)
          .where(and(eq(dadosreproducao.idPropriedade, idPropriedade), isNull(dadosreproducao.deletedAt))),
      ]);

      return {
        data,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar coberturas por propriedade: ${error.message}`);
    }
  }

  /**
   * Busca cobertura por ID com relacionamentos
   */
  async findById(idReproducao: string) {
    try {
      const result = await this.databaseService.db.query.dadosreproducao.findFirst({
        where: eq(dadosreproducao.idReproducao, idReproducao),
        with: {
          bufalo_idBufala: {
            columns: {
              idBufalo: true,
              nome: true,
              brinco: true,
              microchip: true,
            },
          },
          bufalo_idBufalo: {
            columns: {
              idBufalo: true,
              nome: true,
              brinco: true,
              microchip: true,
            },
          },
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar cobertura: ${error.message}`);
    }
  }

  /**
   * Busca cobertura por ID (query simples, sem joins)
   */
  async findByIdSimple(idReproducao: string) {
    try {
      const result = await this.databaseService.db.query.dadosreproducao.findFirst({
        where: eq(dadosreproducao.idReproducao, idReproducao),
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar cobertura: ${error.message}`);
    }
  }

  /**
   * Atualiza cobertura
   */
  async update(idReproducao: string, data: any) {
    try {
      const db = this.databaseService.db;

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await db.update(dadosreproducao).set(updateData).where(eq(dadosreproducao.idReproducao, idReproducao)).returning();

      return result[0] || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar cobertura: ${error.message}`);
    }
  }

  /**
   * Soft delete: marca cobertura como removida
   */
  async softDelete(idReproducao: string) {
    try {
      const db = this.databaseService.db;

      const result = await db
        .update(dadosreproducao)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(dadosreproducao.idReproducao, idReproducao))
        .returning();

      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao remover cobertura: ${error.message}`);
    }
  }

  /**
   * Restaura cobertura removida
   */
  async restore(idReproducao: string) {
    try {
      const db = this.databaseService.db;

      const result = await db.update(dadosreproducao).set({ deletedAt: null }).where(eq(dadosreproducao.idReproducao, idReproducao)).returning();

      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar cobertura: ${error.message}`);
    }
  }

  /**
   * Busca todas coberturas incluindo removidas
   */
  async findAllWithDeleted() {
    try {
      const result = await this.databaseService.db.query.dadosreproducao.findMany({
        orderBy: [desc(dadosreproducao.dtEvento)],
        with: {
          bufalo_idBufala: {
            columns: {
              idBufalo: true,
              nome: true,
              brinco: true,
              microchip: true,
            },
          },
          bufalo_idBufalo: {
            columns: {
              idBufalo: true,
              nome: true,
              brinco: true,
              microchip: true,
            },
          },
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar coberturas: ${error.message}`);
    }
  }
}
