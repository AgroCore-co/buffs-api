import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, isNull, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * Repository base abstrato com métodos CRUD padrão e soft delete.
 * Implementa padrões comuns para evitar duplicação de código entre repositories.
 *
 * @template TTable - Tipo da tabela Drizzle
 * @template TInsert - Tipo de dados para inserção
 * @template TSelect - Tipo de dados retornados nas consultas
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MeuRepository extends BaseRepository<typeof minhaTabela> {
 *   constructor(protected readonly databaseService: DatabaseService) {
 *     super(databaseService, minhaTabela, 'id_coluna', 'MeuRepository');
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<TTable extends PgTable> {
  /**
   * @param databaseService - Serviço de conexão com banco de dados
   * @param table - Tabela Drizzle a ser manipulada
   * @param idColumn - Nome da coluna ID (ex: 'idBufalo', 'idPropriedade')
   * @param repositoryName - Nome do repository para logs de erro
   */
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly table: TTable,
    protected readonly idColumn: string,
    protected readonly repositoryName: string,
  ) {}

  /**
   * Acessa a instância do banco de dados através do getter.
   * Garante que o db esteja disponível quando necessário.
   */
  protected get db() {
    return this.databaseService.db;
  }

  /**
   * Cria um novo registro na tabela.
   *
   * @param data - Dados a serem inseridos
   * @returns Registro criado
   * @throws InternalServerErrorException em caso de erro
   */
  async create(data: any): Promise<any> {
    try {
      const [result] = await this.db
        .insert(this.table)
        .values(data as any)
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao criar registro: ${error.message}`);
    }
  }

  /**
   * Busca um registro por ID, excluindo registros com soft delete.
   *
   * @param id - ID do registro
   * @returns Registro encontrado ou null
   * @throws InternalServerErrorException em caso de erro
   */
  async findById(id: string): Promise<any | null> {
    try {
      const deletedAtColumn = (this.table as any).deletedAt;
      const conditions: SQL[] = [eq((this.table as any)[this.idColumn], id)];

      // Se a tabela tiver deletedAt, adiciona condição
      if (deletedAtColumn) {
        conditions.push(isNull(deletedAtColumn));
      }

      const [result] = await this.db
        .select()
        .from(this.table as any)
        .where(and(...conditions))
        .limit(1);

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao buscar registro por ID: ${error.message}`);
    }
  }

  /**
   * Busca todos os registros não deletados.
   *
   * @param limit - Limite de registros (opcional)
   * @param offset - Offset para paginação (opcional)
   * @returns Array de registros
   * @throws InternalServerErrorException em caso de erro
   */
  async findAll(limit?: number, offset?: number): Promise<any[]> {
    try {
      const deletedAtColumn = (this.table as any).deletedAt;
      let query = this.db.select().from(this.table as any);

      // Se a tabela tiver deletedAt, adiciona filtro
      if (deletedAtColumn) {
        query = query.where(isNull(deletedAtColumn)) as any;
      }

      if (limit) {
        query = query.limit(limit) as any;
      }

      if (offset !== undefined) {
        query = query.offset(offset) as any;
      }

      const results = await query;
      return results;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao buscar todos os registros: ${error.message}`);
    }
  }

  /**
   * Busca todos os registros incluindo deletados logicamente.
   *
   * @returns Array de registros
   * @throws InternalServerErrorException em caso de erro
   */
  async findAllWithDeleted(): Promise<any[]> {
    try {
      const results = await this.db.select().from(this.table as any);
      return results;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao buscar registros (incluindo deletados): ${error.message}`);
    }
  }

  /**
   * Atualiza um registro por ID.
   *
   * @param id - ID do registro
   * @param data - Dados parciais a serem atualizados
   * @returns Registro atualizado ou null
   * @throws InternalServerErrorException em caso de erro
   */
  async update(id: string, data: any): Promise<any | null> {
    try {
      const results: any = await this.db
        .update(this.table)
        .set(data as any)
        .where(eq((this.table as any)[this.idColumn], id))
        .returning();

      return results[0] || null;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao atualizar registro: ${error.message}`);
    }
  }

  /**
   * Remove logicamente um registro (soft delete).
   * Define deletedAt para timestamp atual.
   *
   * @param id - ID do registro
   * @returns Registro deletado ou null
   * @throws InternalServerErrorException em caso de erro
   */
  async softDelete(id: string): Promise<any | null> {
    try {
      const deletedAtColumn = (this.table as any).deletedAt;

      if (!deletedAtColumn) {
        throw new Error(`Tabela ${this.table} não possui coluna deletedAt para soft delete`);
      }

      const results: any = await this.db
        .update(this.table)
        .set({ deletedAt: new Date().toISOString() } as any)
        .where(eq((this.table as any)[this.idColumn], id))
        .returning();

      return results[0] || null;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao fazer soft delete: ${error.message}`);
    }
  }

  /**
   * Restaura um registro deletado logicamente.
   * Define deletedAt como null.
   *
   * @param id - ID do registro
   * @returns Registro restaurado ou null
   * @throws InternalServerErrorException em caso de erro
   */
  async restore(id: string): Promise<any | null> {
    try {
      const deletedAtColumn = (this.table as any).deletedAt;

      if (!deletedAtColumn) {
        throw new Error(`Tabela ${this.table} não possui coluna deletedAt para restore`);
      }

      const results: any = await this.db
        .update(this.table)
        .set({ deletedAt: null } as any)
        .where(eq((this.table as any)[this.idColumn], id))
        .returning();

      return results[0] || null;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao restaurar registro: ${error.message}`);
    }
  }

  /**
   * Verifica se um registro existe por ID (não deletado).
   *
   * @param id - ID do registro
   * @returns true se existe, false caso contrário
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Remove permanentemente um registro do banco (hard delete).
   * ⚠️ Use com cuidado - esta operação é irreversível!
   *
   * @param id - ID do registro
   * @returns true se deletado com sucesso
   * @throws InternalServerErrorException em caso de erro
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      await this.db.delete(this.table).where(eq((this.table as any)[this.idColumn], id));

      return true;
    } catch (error) {
      throw new InternalServerErrorException(`[${this.repositoryName}] Erro ao fazer hard delete: ${error.message}`);
    }
  }
}
