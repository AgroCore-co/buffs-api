import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, desc, eq, getTableColumns, gte } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { bufalo, dadossanitarios, medicacoes } from '../../../database/schema';

@Injectable()
export class SyncEventosSanitariosRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private logRepositoryError(method: string, error: unknown): void {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    this.logger.logError(normalizedError, {
      repository: 'SyncEventosSanitariosRepository',
      method,
    });
  }

  async findByPropriedade(idPropriedade: string, updatedAt?: string) {
    try {
      const columns = getTableColumns(dadossanitarios);
      const conditions = [eq(bufalo.idPropriedade, idPropriedade)];
      if (updatedAt) {
        conditions.push(gte(dadossanitarios.updatedAt, updatedAt));
      }

      return await this.databaseService.db
        .select({
          ...columns,
          medicacoe: {
            medicacao: medicacoes.medicacao,
            tipoTratamento: medicacoes.tipoTratamento,
          },
        })
        .from(dadossanitarios)
        .innerJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
        .leftJoin(medicacoes, eq(dadossanitarios.idMedicao, medicacoes.idMedicacao))
        .where(and(...conditions))
        .orderBy(desc(dadossanitarios.updatedAt), desc(dadossanitarios.createdAt));
    } catch (error) {
      this.logRepositoryError('findByPropriedade', error);
      throw new InternalServerErrorException('Erro ao buscar eventos sanitarios para sincronizacao.');
    }
  }
}
