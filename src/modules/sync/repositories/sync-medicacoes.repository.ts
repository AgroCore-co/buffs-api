import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { medicacoes } from '../../../database/schema';

@Injectable()
export class SyncMedicacoesRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncMedicacoesRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const conditions = [eq(medicacoes.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(medicacoes.updatedAt, updatedAt));
      }

      return await this.databaseService.db.query.medicacoes.findMany({
        where: and(...conditions),
        orderBy: [desc(medicacoes.updatedAt), desc(medicacoes.createdAt)],
      });
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar medicacoes para sincronizacao.');
    }
  }
}
