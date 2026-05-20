import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { alertas } from '../../../database/schema';

@Injectable()
export class SyncAlertasRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncAlertasRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const conditions = [eq(alertas.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(alertas.updatedAt, updatedAt));
      }

      return await this.databaseService.db.query.alertas.findMany({
        where: and(...conditions),
        with: {
          bufalo: {
            columns: {
              nome: true,
              brinco: true,
            },
          },
        },
        orderBy: [desc(alertas.updatedAt), desc(alertas.dataAlerta)],
      });
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar alertas para sincronizacao.');
    }
  }
}
