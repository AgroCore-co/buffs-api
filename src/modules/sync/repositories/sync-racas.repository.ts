import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { desc, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { raca } from '../../../database/schema';

@Injectable()
export class SyncRacasRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncRacasRepository',
      method,
    });
  }

  async findAll(updatedAt?: string) {
    try {
      return await this.databaseService.db.query.raca.findMany({
        where: updatedAt ? gte(raca.updatedAt, updatedAt) : undefined,
        orderBy: [desc(raca.updatedAt), desc(raca.createdAt)],
      });
    } catch (error) {
      this.logRepositoryError('findAll', error);
      throw new InternalServerErrorException('Erro ao buscar racas para sincronizacao.');
    }
  }
}
