import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { dadosreproducao } from '../../../database/schema';

@Injectable()
export class SyncReproducaoRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncReproducaoRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const conditions = [eq(dadosreproducao.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(dadosreproducao.updatedAt, updatedAt));
      }

      return await this.databaseService.db.query.dadosreproducao.findMany({
        where: and(...conditions),
        with: {
          bufalo_idBufala: {
            columns: {
              nome: true,
              brinco: true,
            },
          },
          bufalo_idBufalo: {
            columns: {
              nome: true,
              brinco: true,
            },
          },
        },
        orderBy: [desc(dadosreproducao.updatedAt), desc(dadosreproducao.dtEvento)],
      });
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar reproducao para sincronizacao.');
    }
  }
}
