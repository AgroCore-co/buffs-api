import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, getTableColumns, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { bufalo, dadoszootecnicos } from '../../../database/schema';

@Injectable()
export class SyncPesagensRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncPesagensRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const columns = getTableColumns(dadoszootecnicos);
      const conditions = [eq(bufalo.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(dadoszootecnicos.updatedAt, updatedAt));
      }

      return await this.databaseService.db
        .select({
          ...columns,
        })
        .from(dadoszootecnicos)
        .innerJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(and(...conditions))
        .orderBy(desc(dadoszootecnicos.updatedAt), desc(dadoszootecnicos.createdAt));
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar pesagens para sincronizacao.');
    }
  }
}
