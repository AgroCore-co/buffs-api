import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { BaseRepository } from '../../../../core/database/base.repository';
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
export class MaterialGeneticoRepositoryDrizzle extends BaseRepository<typeof materialgenetico> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, materialgenetico, 'idMaterial', 'MaterialGeneticoRepositoryDrizzle');
  }

  /**
   * Cria novo material genético
   * Mapeia snake_case (DTO) → camelCase (schema)
   */
  async createFromDto(data: any) {
    const mappedData = {
      tipo: data.tipo,
      origem: data.origem,
      idBufaloOrigem: data.idBufaloOrigem,
      fornecedor: data.fornecedor,
      dataColeta: data.dataColeta,
      idPropriedade: data.idPropriedade,
    };
    return this.create(mappedData);
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

    return this.update(idMaterial, mappedData);
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
}
