import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, desc, count, asc } from 'drizzle-orm';
import { alimregistro, alimentacaodef, grupo, usuario } from 'src/database/schema';

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
   * Mapeia snake_case (DTO) para camelCase (schema)
   */
  async update(idRegistro: string, data: any) {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      // Mapeia snake_case para camelCase
      if (data.id_propriedade !== undefined) updateData.idPropriedade = data.id_propriedade;
      if (data.id_grupo !== undefined) updateData.idGrupo = data.id_grupo;
      if (data.id_aliment_def !== undefined) updateData.idAlimentDef = data.id_aliment_def;
      if (data.id_usuario !== undefined) updateData.idUsuario = data.id_usuario;
      if (data.quantidade !== undefined) updateData.quantidade = data.quantidade;
      if (data.unidade_medida !== undefined) updateData.unidadeMedida = data.unidade_medida;
      if (data.freq_dia !== undefined) updateData.freqDia = data.freq_dia;
      if (data.dt_registro !== undefined) updateData.dtRegistro = data.dt_registro;

      const result = await this.databaseService.db.update(alimregistro).set(updateData).where(eq(alimregistro.idRegistro, idRegistro)).returning();

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
