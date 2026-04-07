import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, gte, desc } from 'drizzle-orm';
import { dadoslactacao } from 'src/database/schema';

/**
 * Repository Drizzle para busca de dados de produção.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class ProducaoRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca produções de leite dos últimos X dias (dadoslactacao).
   */
  async buscarProducoesRecentes(diasAtras: number, id_propriedade?: string) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      const conditions: any[] = [gte(dadoslactacao.dtOrdenha, dataLimiteStr)];

      if (id_propriedade) {
        conditions.push(eq(dadoslactacao.idPropriedade, id_propriedade));
      }

      return await this.databaseService.db.query.dadoslactacao.findMany({
        where: and(...conditions),
        columns: {
          idBufala: true,
          qtOrdenha: true,
          dtOrdenha: true,
        },
        orderBy: [desc(dadoslactacao.dtOrdenha)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ProducaoRepositoryDrizzle',
        method: 'buscarProducoesRecentes',
        diasAtras,
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar produções recentes: ${error.message}`);
    }
  }

  /**
   * Busca ordenhas recentes de uma búfala específica (dadoslactacao).
   */
  async buscarOrdenhasRecentes(id_bufala: string, diasAtras: number) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      return await this.databaseService.db.query.dadoslactacao.findMany({
        where: and(eq(dadoslactacao.idBufala, id_bufala), gte(dadoslactacao.dtOrdenha, dataLimiteStr)),
        columns: {
          idLact: true,
          dtOrdenha: true,
          qtOrdenha: true,
        },
        limit: 10,
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ProducaoRepositoryDrizzle',
        method: 'buscarOrdenhasRecentes',
        id_bufala,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar ordenhas recentes: ${error.message}`);
    }
  }
}
