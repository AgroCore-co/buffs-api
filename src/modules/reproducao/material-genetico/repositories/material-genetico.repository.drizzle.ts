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
   * Mapeia snake_case (DTO) → camelCase (schema)
   */
  async createFromDto(data: any) {
    try {
      const results: any = await this.databaseService.db
        .insert(materialgenetico)
        .values({
          tipo: data.tipo,
          origem: data.origem,
          idBufaloOrigem: data.idBufaloOrigem,
          fornecedor: data.fornecedor,
          dataColeta: data.dataColeta,
          idPropriedade: data.idPropriedade,
        })
        .returning();
      return results[0];
    } catch (error) {
      throw new InternalServerErrorException(`[MaterialGeneticoRepository] Erro ao criar: ${error.message}`);
    }
  }

  /**
   * Atualiza material genético
   * Mapeia snake_case (DTO) → camelCase (schema)
   */
  async updateFromDto(idMaterial: string, data: any) {
    const mappedData: any = {};

    if (data.tipo !== undefined) mappedData.tipo = data.tipo;
    if (data.origem !== undefined) mappedData.origem = data.origem;
    if (data.idBufaloOrigem !== undefined) mappedData.idBufaloOrigem = data.idBufaloOrigem;
    if (data.fornecedor !== undefined) mappedData.fornecedor = data.fornecedor;
    if (data.dataColeta !== undefined) mappedData.dataColeta = data.dataColeta;
    if (data.idPropriedade !== undefined) mappedData.idPropriedade = data.idPropriedade;

    const [result] = await this.databaseService.db
      .update(materialgenetico)
      .set(mappedData)
      .where(eq(materialgenetico.idMaterial, idMaterial))
      .returning();
    return result || null;
  }

  async findById(id: string) {
    const [result] = await this.databaseService.db
      .select()
      .from(materialgenetico)
      .where(and(eq(materialgenetico.idMaterial, id), isNull(materialgenetico.deletedAt)))
      .limit(1);
    return result || null;
  }

  /**
   * Busca todos os materiais genéticos com paginação
   * Retorna formato {data, total} para compatibilidade com service
   */
  async findAllPaginated(offset: number, limit: number) {
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
  }

  /**
   * Busca materiais genéticos por propriedade com paginação
   */
  async findByPropriedade(idPropriedade: string, offset: number, limit: number) {
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
  }

  async softDelete(id: string) {
    const [result] = await this.databaseService.db
      .update(materialgenetico)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(materialgenetico.idMaterial, id))
      .returning();
    return result || null;
  }

  async restore(id: string) {
    const [result] = await this.databaseService.db
      .update(materialgenetico)
      .set({ deletedAt: null })
      .where(eq(materialgenetico.idMaterial, id))
      .returning();
    return result || null;
  }

  async findAllWithDeleted() {
    return await this.databaseService.db.query.materialgenetico.findMany({
      orderBy: [desc(materialgenetico.createdAt)],
    });
  }

  async create(data: any) {
    return this.createFromDto(data);
  }

  async update(id: string, data: any) {
    return this.updateFromDto(id, data);
  }
}
