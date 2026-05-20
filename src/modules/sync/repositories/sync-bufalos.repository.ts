import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { bufalo } from '../../../database/schema';

@Injectable()
export class SyncBufalosRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncBufalosRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const conditions = [eq(bufalo.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(bufalo.updatedAt, updatedAt));
      }

      return await this.databaseService.db.query.bufalo.findMany({
        where: and(...conditions),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
        },
        orderBy: [desc(bufalo.updatedAt), desc(bufalo.createdAt)],
      });
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar bufalos para sincronizacao.');
    }
  }
}
