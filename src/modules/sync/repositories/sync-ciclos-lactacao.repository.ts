import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, getTableColumns, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { bufalo, ciclolactacao, raca } from '../../../database/schema';

@Injectable()
export class SyncCiclosLactacaoRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncCiclosLactacaoRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const columns = getTableColumns(ciclolactacao);
      const conditions = [eq(ciclolactacao.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(ciclolactacao.updatedAt, updatedAt));
      }

      return await this.databaseService.db
        .select({
          ...columns,
          bufala: {
            nome: bufalo.nome,
            brinco: bufalo.brinco,
            raca: raca.nome,
          },
        })
        .from(ciclolactacao)
        .leftJoin(bufalo, eq(ciclolactacao.idBufala, bufalo.idBufalo))
        .leftJoin(raca, eq(bufalo.idRaca, raca.idRaca))
        .where(and(...conditions))
        .orderBy(desc(ciclolactacao.updatedAt), desc(ciclolactacao.createdAt));
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar ciclos de lactacao para sincronizacao.');
    }
  }
}
