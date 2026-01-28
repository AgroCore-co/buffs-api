import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, gte, lte, inArray, count, asc } from 'drizzle-orm';
import { alertas } from 'src/database/schema';

/**
 * Repository Drizzle para alertas
 * Isola queries do Drizzle da lógica de negócio do AlertasService
 */
@Injectable()
export class AlertaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo alerta
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async create(data: any) {
    try {
      const mappedData = {
        animalId: data.animal_id,
        grupo: data.grupo,
        localizacao: data.localizacao,
        idPropriedade: data.id_propriedade,
        motivo: data.motivo,
        nicho: data.nicho,
        dataAlerta: data.data_alerta,
        prioridade: data.prioridade,
        observacao: data.observacao,
        visto: data.visto,
        idEventoOrigem: data.id_evento_origem,
        tipoEventoOrigem: data.tipo_evento_origem,
      };

      const result = await this.databaseService.db.insert(alertas).values(mappedData).returning();

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca alertas existentes por critérios de identificação única
   * Usado para verificação de duplicatas na lógica de idempotência
   */
  async findExisting(tipoEvento: string, idEvento: string, animalId: string, nicho: string) {
    try {
      const result = await this.databaseService.db.query.alertas.findMany({
        where: and(
          eq(alertas.tipoEventoOrigem, tipoEvento),
          eq(alertas.idEventoOrigem, idEvento),
          eq(alertas.animalId, animalId),
          eq(alertas.nicho, nicho),
        ),
        columns: {
          idAlerta: true,
          visto: true,
          createdAt: true,
        },
        orderBy: [desc(alertas.createdAt)],
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Busca alerta recorrente na mesma data que não foi visto
   * Usado para evitar duplicatas de alertas recorrentes no mesmo dia
   */
  async findRecorrenteSameDate(tipoEvento: string, idEvento: string, animalId: string, dataAlerta: string) {
    try {
      const result = await this.databaseService.db.query.alertas.findFirst({
        where: and(
          eq(alertas.tipoEventoOrigem, tipoEvento),
          eq(alertas.idEventoOrigem, idEvento),
          eq(alertas.animalId, animalId),
          eq(alertas.dataAlerta, dataAlerta),
          eq(alertas.visto, false),
        ),
        columns: {
          idAlerta: true,
        },
      });

      return { data: result || null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca todos os alertas com filtros e paginação
   */
  async findAll(filters: { nicho?: string; visto?: boolean; dataInicio?: string; dataFim?: string; limit: number; offset: number }) {
    try {
      const conditions: any[] = [];

      if (filters.nicho) {
        conditions.push(eq(alertas.nicho, filters.nicho));
      }

      if (filters.visto !== undefined) {
        conditions.push(eq(alertas.visto, filters.visto));
      }

      if (filters.dataInicio) {
        conditions.push(gte(alertas.dataAlerta, filters.dataInicio));
      }

      if (filters.dataFim) {
        conditions.push(lte(alertas.dataAlerta, filters.dataFim));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.databaseService.db.query.alertas.findMany({
        where: whereClause,
        orderBy: [asc(alertas.dataAlerta), desc(alertas.prioridade)],
        limit: filters.limit,
        offset: filters.offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta total de alertas com filtros
   */
  async countAll(filters: { nicho?: string; visto?: boolean; dataInicio?: string; dataFim?: string }) {
    try {
      const conditions: any[] = [];

      if (filters.nicho) {
        conditions.push(eq(alertas.nicho, filters.nicho));
      }

      if (filters.visto !== undefined) {
        conditions.push(eq(alertas.visto, filters.visto));
      }

      if (filters.dataInicio) {
        conditions.push(gte(alertas.dataAlerta, filters.dataInicio));
      }

      if (filters.dataFim) {
        conditions.push(lte(alertas.dataAlerta, filters.dataFim));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.databaseService.db.select({ count: count() }).from(alertas).where(whereClause);

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca alertas por propriedade com filtros e paginação
   */
  async findByPropriedade(filters: {
    idPropriedade: string;
    visto?: boolean;
    nichos?: string[];
    prioridade?: string;
    limit: number;
    offset: number;
  }) {
    try {
      const conditions = [eq(alertas.idPropriedade, filters.idPropriedade)];

      if (filters.visto !== undefined) {
        conditions.push(eq(alertas.visto, filters.visto));
      }

      if (filters.nichos && filters.nichos.length > 0) {
        conditions.push(inArray(alertas.nicho, filters.nichos));
      }

      if (filters.prioridade) {
        conditions.push(eq(alertas.prioridade, filters.prioridade));
      }

      const result = await this.databaseService.db.query.alertas.findMany({
        where: and(...conditions),
        with: {
          bufalo: {
            columns: {
              nome: true,
              brinco: true,
            },
          },
        },
        orderBy: [asc(alertas.dataAlerta), desc(alertas.prioridade)],
        limit: filters.limit,
        offset: filters.offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta alertas por propriedade com filtros
   */
  async countByPropriedade(filters: { idPropriedade: string; visto?: boolean; nichos?: string[]; prioridade?: string }) {
    try {
      const conditions = [eq(alertas.idPropriedade, filters.idPropriedade)];

      if (filters.visto !== undefined) {
        conditions.push(eq(alertas.visto, filters.visto));
      }

      if (filters.nichos && filters.nichos.length > 0) {
        conditions.push(inArray(alertas.nicho, filters.nichos));
      }

      if (filters.prioridade) {
        conditions.push(eq(alertas.prioridade, filters.prioridade));
      }

      const result = await this.databaseService.db
        .select({ count: count() })
        .from(alertas)
        .where(and(...conditions));

      return { count: result[0]?.count || 0, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Busca um alerta por ID
   */
  async findOne(idAlerta: string) {
    try {
      const result = await this.databaseService.db.query.alertas.findFirst({
        where: eq(alertas.idAlerta, idAlerta),
      });

      if (!result) {
        return { data: null, error: { code: 'PGRST116', message: 'Alerta não encontrado' } };
      }

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Atualiza status de visualização de um alerta
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async update(idAlerta: string, data: any) {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Mapeia snake_case para camelCase
      if (data.animal_id !== undefined) updateData.animalId = data.animal_id;
      if (data.grupo !== undefined) updateData.grupo = data.grupo;
      if (data.localizacao !== undefined) updateData.localizacao = data.localizacao;
      if (data.id_propriedade !== undefined) updateData.idPropriedade = data.id_propriedade;
      if (data.motivo !== undefined) updateData.motivo = data.motivo;
      if (data.nicho !== undefined) updateData.nicho = data.nicho;
      if (data.data_alerta !== undefined) updateData.dataAlerta = data.data_alerta;
      if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
      if (data.observacao !== undefined) updateData.observacao = data.observacao;
      if (data.visto !== undefined) updateData.visto = data.visto;
      if (data.id_evento_origem !== undefined) updateData.idEventoOrigem = data.id_evento_origem;
      if (data.tipo_evento_origem !== undefined) updateData.tipoEventoOrigem = data.tipo_evento_origem;

      const result = await this.databaseService.db.update(alertas).set(updateData).where(eq(alertas.idAlerta, idAlerta)).returning();

      if (!result || result.length === 0) {
        return { data: null, error: { code: 'PGRST116', message: 'Alerta não encontrado' } };
      }

      return { data: result[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Remove um alerta
   */
  async remove(idAlerta: string) {
    try {
      await this.databaseService.db.delete(alertas).where(eq(alertas.idAlerta, idAlerta));

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
