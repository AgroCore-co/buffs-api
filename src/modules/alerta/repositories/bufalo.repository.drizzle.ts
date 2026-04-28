import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, lte, gte, isNull, asc, inArray } from 'drizzle-orm';
import { bufalo, grupo, propriedade, dadoszootecnicos } from 'src/database/schema';

/**
 * Repository Drizzle para busca de dados de búfalos.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class BufaloRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca búfalo com informações de grupo e propriedade (join).
   */
  async buscarBufaloCompleto(id_bufalo: string) {
    try {
      return await this.databaseService.db.query.bufalo.findFirst({
        where: eq(bufalo.idBufalo, id_bufalo),
        with: {
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarBufaloCompleto',
        id_bufalo,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalo completo: ${error.message}`);
    }
  }

  /**
   * Busca múltiplos búfalos com informações de grupo e propriedade em uma única consulta.
   */
  async buscarBufalosCompletosBatch(ids_bufalos: string[]) {
    try {
      if (!ids_bufalos.length) {
        return [];
      }

      return await this.databaseService.db.query.bufalo.findMany({
        where: inArray(bufalo.idBufalo, ids_bufalos),
        columns: {
          idBufalo: true,
          nome: true,
          idPropriedade: true,
          dtNascimento: true,
        },
        with: {
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarBufalosCompletosBatch',
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalos completos em lote: ${error.message}`);
    }
  }

  /**
   * Busca búfalo simples (sem joins) para performance.
   */
  async buscarBufaloSimples(id_bufalo: string) {
    try {
      return await this.databaseService.db.query.bufalo.findFirst({
        where: eq(bufalo.idBufalo, id_bufalo),
        columns: {
          idBufalo: true,
          nome: true,
          idGrupo: true,
          idPropriedade: true,
          dtNascimento: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarBufaloSimples',
        id_bufalo,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalo simples: ${error.message}`);
    }
  }

  /**
   * Busca nome do grupo de um búfalo.
   */
  async buscarNomeGrupo(id_grupo: string): Promise<string | null> {
    try {
      const result = await this.databaseService.db.query.grupo.findFirst({
        where: eq(grupo.idGrupo, id_grupo),
        columns: {
          nomeGrupo: true,
        },
      });

      return result?.nomeGrupo || null;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarNomeGrupo',
        id_grupo,
      });
      throw new InternalServerErrorException(`Erro ao buscar nome do grupo: ${error.message}`);
    }
  }

  /**
   * Busca nome da propriedade.
   */
  async buscarNomePropriedade(id_propriedade: string): Promise<string | null> {
    try {
      const result = await this.databaseService.db.query.propriedade.findFirst({
        where: eq(propriedade.idPropriedade, id_propriedade),
        columns: {
          nome: true,
        },
      });

      return result?.nome || null;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarNomePropriedade',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar nome da propriedade: ${error.message}`);
    }
  }

  /**
   * Busca fêmeas aptas à reprodução de uma propriedade.
   */
  async buscarFemeasAptasReproducao(idadeMinimaData: Date, id_propriedade?: string) {
    try {
      const conditions = [eq(bufalo.sexo, 'F'), eq(bufalo.status, true), lte(bufalo.dtNascimento, idadeMinimaData)];

      if (id_propriedade) {
        conditions.push(eq(bufalo.idPropriedade, id_propriedade));
      }

      return await this.databaseService.db.query.bufalo.findMany({
        where: and(...conditions),
        columns: {
          idBufalo: true,
          nome: true,
          dtNascimento: true,
          idGrupo: true,
          idPropriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarFemeasAptasReproducao',
        idadeMinimaData,
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar fêmeas aptas à reprodução: ${error.message}`);
    }
  }

  /**
   * Busca todos os búfalos ativos.
   */
  async buscarBufalosAtivos(id_propriedade?: string) {
    try {
      const conditions = [eq(bufalo.status, true)];

      if (id_propriedade) {
        conditions.push(eq(bufalo.idPropriedade, id_propriedade));
      }

      return await this.databaseService.db.query.bufalo.findMany({
        where: conditions.length > 1 ? and(...conditions) : conditions[0],
        columns: {
          idBufalo: true,
          nome: true,
          idGrupo: true,
          idPropriedade: true,
          dtNascimento: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarBufalosAtivos',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar búfalos ativos: ${error.message}`);
    }
  }

  /**
   * Busca IDs de búfalos de uma propriedade.
   */
  async buscarIdsBufalosPorPropriedade(id_propriedade: string): Promise<string[]> {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: eq(bufalo.idPropriedade, id_propriedade),
        columns: {
          idBufalo: true,
        },
      });

      return result.map((b) => b.idBufalo);
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarIdsBufalosPorPropriedade',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar IDs de búfalos: ${error.message}`);
    }
  }

  /**
   * Busca pesagens de um búfalo em período específico.
   */
  async buscarPesagensRecentes(id_bufalo: string, diasAtras: number) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      return await this.databaseService.db.query.dadoszootecnicos.findMany({
        where: and(eq(dadoszootecnicos.idBufalo, id_bufalo), gte(dadoszootecnicos.dtRegistro, dataLimiteStr), isNull(dadoszootecnicos.deletedAt)),
        columns: {
          peso: true,
          dtRegistro: true,
          tipoPesagem: true,
        },
        orderBy: [asc(dadoszootecnicos.dtRegistro)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarPesagensRecentes',
        id_bufalo,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar pesagens recentes: ${error.message}`);
    }
  }

  /**
   * Busca pesagens recentes de múltiplos búfalos em uma única consulta.
   */
  async buscarPesagensRecentesBatch(ids_bufalos: string[], diasAtras: number) {
    try {
      if (!ids_bufalos.length) {
        return [];
      }

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      return await this.databaseService.db.query.dadoszootecnicos.findMany({
        where: and(
          inArray(dadoszootecnicos.idBufalo, ids_bufalos),
          gte(dadoszootecnicos.dtRegistro, dataLimiteStr),
          isNull(dadoszootecnicos.deletedAt),
        ),
        columns: {
          idBufalo: true,
          peso: true,
          dtRegistro: true,
          tipoPesagem: true,
        },
        orderBy: [asc(dadoszootecnicos.idBufalo), asc(dadoszootecnicos.dtRegistro)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'BufaloRepositoryDrizzle',
        method: 'buscarPesagensRecentesBatch',
        ids_bufalos,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar pesagens recentes em lote: ${error.message}`);
    }
  }
}
