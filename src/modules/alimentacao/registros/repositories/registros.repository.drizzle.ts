import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, desc, count, and, isNull } from 'drizzle-orm';
import { alimregistro, alimentacaodef, grupo } from 'src/database/schema';
import { CreateRegistroAlimentacaoDto } from '../dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from '../dto/update-registro.dto';

type AlimRegistroInsert = typeof alimregistro.$inferInsert;
type AlimRegistroSelect = typeof alimregistro.$inferSelect;

export type CreateRegistroPayload = CreateRegistroAlimentacaoDto & { id_usuario: string };

export type CreateRegistroValidationError =
  | 'GROUP_NOT_FOUND'
  | 'GROUP_PROPERTY_MISMATCH'
  | 'ALIMENT_DEF_NOT_FOUND'
  | 'ALIMENT_DEF_PROPERTY_MISMATCH'
  | 'INSERT_FAILED';

type CreateRegistroResult = {
  data: AlimRegistroSelect | null;
  error: unknown | null;
  validationError: CreateRegistroValidationError | null;
};

/**
 * Repository Drizzle para alimregistro (Registros de Alimentação)
 */
@Injectable()
export class RegistrosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo registro com validações de consistência em transação única.
   * Evita race condition entre validação de vínculos e insert.
   */
  async create(data: CreateRegistroPayload): Promise<CreateRegistroResult> {
    try {
      return await this.databaseService.db.transaction(async (tx) => {
        const grupoData = await tx.query.grupo.findFirst({
          where: and(eq(grupo.idGrupo, data.id_grupo), isNull(grupo.deletedAt)),
          columns: {
            idPropriedade: true,
          },
        });

        if (!grupoData) {
          return { data: null, error: null, validationError: 'GROUP_NOT_FOUND' };
        }

        if (grupoData.idPropriedade !== data.id_propriedade) {
          return { data: null, error: null, validationError: 'GROUP_PROPERTY_MISMATCH' };
        }

        const alimentDefData = await tx.query.alimentacaodef.findFirst({
          where: and(eq(alimentacaodef.idAlimentDef, data.id_aliment_def), isNull(alimentacaodef.deletedAt)),
          columns: {
            idPropriedade: true,
          },
        });

        if (!alimentDefData) {
          return { data: null, error: null, validationError: 'ALIMENT_DEF_NOT_FOUND' };
        }

        if (alimentDefData.idPropriedade !== data.id_propriedade) {
          return { data: null, error: null, validationError: 'ALIMENT_DEF_PROPERTY_MISMATCH' };
        }

        const mappedData: Partial<AlimRegistroInsert> = {
          idPropriedade: data.id_propriedade,
          idGrupo: data.id_grupo,
          idAlimentDef: data.id_aliment_def,
          idUsuario: data.id_usuario,
          quantidade: data.quantidade.toString(),
          unidadeMedida: data.unidade_medida,
          freqDia: data.freq_dia,
          dtRegistro: data.dt_registro,
        };

        const result = await tx
          .insert(alimregistro)
          .values(mappedData as AlimRegistroInsert)
          .returning();

        if (!result[0]) {
          return { data: null, error: null, validationError: 'INSERT_FAILED' };
        }

        return { data: result[0], error: null, validationError: null };
      });
    } catch (error) {
      return { data: null, error, validationError: null };
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
  async update(idRegistro: string, data: UpdateRegistroAlimentacaoDto): Promise<{ data: AlimRegistroSelect | null; error: unknown | null }> {
    try {
      const updateData: Partial<AlimRegistroInsert> = {
        updatedAt: new Date().toISOString(),
      };

      // Mapeia snake_case para camelCase
      if (data.quantidade !== undefined) updateData.quantidade = data.quantidade.toString();
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
