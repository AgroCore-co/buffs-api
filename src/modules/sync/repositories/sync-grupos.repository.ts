import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { grupo } from '../../../database/schema';

@Injectable()
export class SyncGruposRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncGruposRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const conditions = [eq(grupo.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(grupo.updatedAt, updatedAt));
      }

      return await this.databaseService.db.query.grupo.findMany({
        where: and(...conditions),
        orderBy: [desc(grupo.updatedAt), desc(grupo.createdAt)],
      });
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar grupos para sincronizacao.');
    }
  }
}
