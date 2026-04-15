import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, desc, count, isNull, sql, inArray } from 'drizzle-orm';
import { dadosreproducao } from '../../../../database/schema';

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
   * Mapeia snake_case (DTO) → camelCase (schema)
   */
  async create(data: any) {
    try {
      const db = this.databaseService.db;

      // Mapeia snake_case (DTO) → camelCase (schema)
      const mappedData = {
        idOvulo: data.idDoadora,
        idSemen: data.idSemen,
        idBufala: data.idBufala,
        idBufalo: data.idBufalo,
        tipoInseminacao: data.tipoInseminacao,
        status: data.status,
        tipoParto: data.tipoParto,
        dtEvento: data.dtEvento,
        ocorrencia: data.ocorrencia,
        idPropriedade: data.idPropriedade,
      };

      const result = await db.insert(dadosreproducao).values(mappedData).returning();
      return result[0];
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar cobertura: ${error.message}`);
    }
  }

  /**
   * Busca todas as coberturas com paginação
   * Ordenação: prioridade por status (Em andamento → Confirmada → Falha) + data recente
   */
  async findAll(offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      // Definir prioridade de status usando SQL CASE
      const statusPriority = sql`
        CASE ${dadosreproducao.status}
          WHEN 'Em andamento' THEN 1
          WHEN 'Confirmada' THEN 2
          WHEN 'Falha' THEN 3
          WHEN 'Concluída' THEN 4
          ELSE 5
        END
      `;

      const [data, totalResult] = await Promise.all([
        db.query.dadosreproducao.findMany({
          where: isNull(dadosreproducao.deletedAt),
          orderBy: [statusPriority, desc(dadosreproducao.dtEvento)],
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
   * Ordenação: prioridade por status (Em andamento → Confirmada → Falha) + data recente
   */
  async findByPropriedade(idPropriedade: string, offset: number, limit: number) {
    try {
      const db = this.databaseService.db;

      // Definir prioridade de status usando SQL CASE
      const statusPriority = sql`
        CASE ${dadosreproducao.status}
          WHEN 'Em andamento' THEN 1
          WHEN 'Confirmada' THEN 2
          WHEN 'Falha' THEN 3
          WHEN 'Concluída' THEN 4
          ELSE 5
        END
      `;

      const [data, totalResult] = await Promise.all([
        db.query.dadosreproducao.findMany({
          where: and(eq(dadosreproducao.idPropriedade, idPropriedade), isNull(dadosreproducao.deletedAt)),
          orderBy: [statusPriority, desc(dadosreproducao.dtEvento)],
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
   * Busca coberturas por múltiplas propriedades (ownership do usuário)
   */
  async findByPropriedades(idPropriedades: string[], offset: number, limit: number) {
    try {
      if (!idPropriedades.length) {
        return { data: [], total: 0 };
      }

      const db = this.databaseService.db;

      const statusPriority = sql`
        CASE ${dadosreproducao.status}
          WHEN 'Em andamento' THEN 1
          WHEN 'Confirmada' THEN 2
          WHEN 'Falha' THEN 3
          WHEN 'Concluída' THEN 4
          ELSE 5
        END
      `;

      const [data, totalResult] = await Promise.all([
        db.query.dadosreproducao.findMany({
          where: and(inArray(dadosreproducao.idPropriedade, idPropriedades), isNull(dadosreproducao.deletedAt)),
          orderBy: [statusPriority, desc(dadosreproducao.dtEvento)],
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
          .where(and(inArray(dadosreproducao.idPropriedade, idPropriedades), isNull(dadosreproducao.deletedAt))),
      ]);

      return {
        data,
        total: totalResult[0]?.count || 0,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar coberturas por propriedades: ${error.message}`);
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
   * Mapeia snake_case (DTO) → camelCase (schema)
   */
  async update(idReproducao: string, data: any) {
    try {
      const db = this.databaseService.db;

      // Mapeia snake_case (DTO) → camelCase (schema), apenas campos fornecidos
      const mappedData: any = {};

      if (data.idDoadora !== undefined) mappedData.idOvulo = data.idDoadora;
      if (data.idSemen !== undefined) mappedData.idSemen = data.idSemen;
      if (data.idBufala !== undefined) mappedData.idBufala = data.idBufala;
      if (data.idBufalo !== undefined) mappedData.idBufalo = data.idBufalo;
      if (data.tipoInseminacao !== undefined) mappedData.tipoInseminacao = data.tipoInseminacao;
      if (data.status !== undefined) mappedData.status = data.status;
      if (data.tipo_parto !== undefined) mappedData.tipoParto = data.tipo_parto;
      if (data.tipoParto !== undefined) mappedData.tipoParto = data.tipoParto;
      if (data.dtEvento !== undefined) mappedData.dtEvento = data.dtEvento;
      if (data.ocorrencia !== undefined) mappedData.ocorrencia = data.ocorrencia;
      if (data.idPropriedade !== undefined) mappedData.idPropriedade = data.idPropriedade;

      mappedData.updatedAt = new Date().toISOString();

      const result = await db.update(dadosreproducao).set(mappedData).where(eq(dadosreproducao.idReproducao, idReproducao)).returning();

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

  /**
   * Busca coberturas incluindo removidas, restritas por ownership
   */
  async findAllWithDeletedByPropriedades(idPropriedades: string[]) {
    try {
      if (!idPropriedades.length) {
        return [];
      }

      const result = await this.databaseService.db.query.dadosreproducao.findMany({
        where: inArray(dadosreproducao.idPropriedade, idPropriedades),
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
      throw new InternalServerErrorException(`Erro ao buscar coberturas (incluindo deletadas) por propriedades: ${error.message}`);
    }
  }
}
