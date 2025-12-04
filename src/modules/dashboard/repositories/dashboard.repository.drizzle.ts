import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../core/database/database.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { eq, and, gte, lte, count, desc, sql } from 'drizzle-orm';
import { propriedade, bufalo, ciclolactacao, lote, usuariopropriedade, dadoslactacao, dadosreproducao } from '../../../database/schema';

/**
 * Repository Drizzle para queries do Dashboard
 * Isola todas as queries de banco do DashboardService
 */
@Injectable()
export class DashboardRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Verifica se uma propriedade existe
   */
  async verificarPropriedadeExiste(id_propriedade: string) {
    try {
      return await this.databaseService.db.query.propriedade.findFirst({
        where: eq(propriedade.idPropriedade, id_propriedade),
        columns: { idPropriedade: true },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'verificarPropriedadeExiste',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao verificar existência da propriedade: ${error.message}`);
    }
  }

  /**
   * Busca búfalos de uma propriedade com informações de raça
   */
  async buscarBufalosComRaca(id_propriedade: string) {
    try {
      return await this.databaseService.db.query.bufalo.findMany({
        where: eq(bufalo.idPropriedade, id_propriedade),
        columns: {
          sexo: true,
          nivelMaturidade: true,
          status: true,
          idRaca: true,
        },
        with: {
          raca: {
            columns: { nome: true },
          },
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'buscarBufalosComRaca',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalos com raça: ${error.message}`);
    }
  }

  /**
   * Busca búfalas em lactação
   */
  async buscarBufalasLactando(id_propriedade: string) {
    try {
      return await this.databaseService.db.query.ciclolactacao.findMany({
        where: and(eq(ciclolactacao.idPropriedade, id_propriedade), eq(ciclolactacao.status, 'Em Lactação')),
        columns: { idBufala: true },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'buscarBufalasLactando',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalas lactando: ${error.message}`);
    }
  }

  /**
   * Conta total de lotes de uma propriedade
   */
  async contarLotes(id_propriedade: string): Promise<number> {
    try {
      const result = await this.databaseService.db.select({ count: count() }).from(lote).where(eq(lote.idPropriedade, id_propriedade));

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'contarLotes',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao contar lotes: ${error.message}`);
    }
  }

  /**
   * Conta total de usuários de uma propriedade
   */
  async contarUsuarios(id_propriedade: string): Promise<number> {
    try {
      const result = await this.databaseService.db
        .select({ count: count() })
        .from(usuariopropriedade)
        .where(eq(usuariopropriedade.idPropriedade, id_propriedade));

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'contarUsuarios',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao contar usuários: ${error.message}`);
    }
  }

  /**
   * Busca ciclos de lactação com dados relacionados (búfalo e ordenhas)
   */
  async buscarCiclosLactacaoCompletos(id_propriedade: string) {
    try {
      return await this.databaseService.db.query.ciclolactacao.findMany({
        where: and(eq(ciclolactacao.idPropriedade, id_propriedade), sql`${ciclolactacao.dtSecagemReal} IS NOT NULL`),
        columns: {
          idCicloLactacao: true,
          idBufala: true,
          dtParto: true,
          dtSecagemReal: true,
        },
        with: {
          bufalo: {
            columns: {
              nome: true,
              sexo: true,
            },
          },
          dadoslactacaos: {
            columns: {
              qtOrdenha: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'buscarCiclosLactacaoCompletos',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar ciclos de lactação completos: ${error.message}`);
    }
  }

  /**
   * Busca ordenhas de uma propriedade em um período
   */
  async buscarOrdenhasPorPeriodo(id_propriedade: string, dataInicio: string, dataFim: string) {
    try {
      return await this.databaseService.db.query.dadoslactacao.findMany({
        where: and(eq(dadoslactacao.idPropriedade, id_propriedade), gte(dadoslactacao.dtOrdenha, dataInicio), lte(dadoslactacao.dtOrdenha, dataFim)),
        columns: {
          dtOrdenha: true,
          qtOrdenha: true,
          idBufala: true,
        },
        orderBy: [dadoslactacao.dtOrdenha],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'buscarOrdenhasPorPeriodo',
        id_propriedade,
        dataInicio,
        dataFim,
      });
      throw new InternalServerErrorException(`Erro ao buscar ordenhas por período: ${error.message}`);
    }
  }

  /**
   * Busca reproduções de uma propriedade ordenadas por data
   */
  async buscarReproducoes(id_propriedade: string) {
    try {
      return await this.databaseService.db.query.dadosreproducao.findMany({
        where: eq(dadosreproducao.idPropriedade, id_propriedade),
        columns: {
          status: true,
          dtEvento: true,
        },
        orderBy: [desc(dadosreproducao.dtEvento)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'DashboardRepositoryDrizzle',
        method: 'buscarReproducoes',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar reproduções: ${error.message}`);
    }
  }
}
