import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, desc, count, and, isNull } from 'drizzle-orm';
import { alimregistro } from 'src/database/schema';

/**
 * Repository Drizzle para alimregistro (Registros de Alimentação)
 */
@Injectable()
export class RegistrosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo registro de alimentação
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async create(data: any) {
    try {
      const mappedData = {
        idPropriedade: data.id_propriedade,
        idGrupo: data.id_grupo,
        idAlimentDef: data.id_aliment_def,
        idUsuario: data.id_usuario,
        quantidade: data.quantidade,
        unidadeMedida: data.unidade_medida,
        freqDia: data.freq_dia,
        dtRegistro: data.dt_registro,
      };

      const result = await this.databaseService.db.insert(alimregistro).values(mappedData).returning();

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
        where: isNull(alimregistro.deletedAt),
        orderBy: [desc(alimregistro.createdAt)],
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
      const result = await this.databaseService.db.select({ count: count() }).from(alimregistro).where(isNull(alimregistro.deletedAt));

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
        where: and(eq(alimregistro.idPropriedade, idPropriedade), isNull(alimregistro.deletedAt)),
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
        orderBy: [desc(alimregistro.dtRegistro), desc(alimregistro.createdAt)],
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
      const result = await this.databaseService.db
        .select({ count: count() })
        .from(alimregistro)
        .where(and(eq(alimregistro.idPropriedade, idPropriedade), isNull(alimregistro.deletedAt)));

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
        where: and(eq(alimregistro.idRegistro, idRegistro), isNull(alimregistro.deletedAt)),
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
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async update(idRegistro: string, data: any) {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Mapeia snake_case para camelCase
      if (data.quantidade !== undefined) updateData.quantidade = data.quantidade;
      if (data.unidade_medida !== undefined) updateData.unidadeMedida = data.unidade_medida;
      if (data.freq_dia !== undefined) updateData.freqDia = data.freq_dia;
      if (data.dt_registro !== undefined) updateData.dtRegistro = data.dt_registro;

      const result = await this.databaseService.db
        .update(alimregistro)
        .set(updateData)
        .where(and(eq(alimregistro.idRegistro, idRegistro), isNull(alimregistro.deletedAt)))
        .returning();

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
      const result = await this.databaseService.db
        .update(alimregistro)
        .set({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(and(eq(alimregistro.idRegistro, idRegistro), isNull(alimregistro.deletedAt)))
        .returning();

      if (!result || result.length === 0) {
        return { data: null, error: { message: 'Registro de alimentação não encontrado' } };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
