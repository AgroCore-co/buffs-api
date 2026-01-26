import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, gte, lte, desc, asc, inArray, isNull } from 'drizzle-orm';
import { dadoslactacao, dadoszootecnicos, medicacoes, dadossanitarios } from 'src/database/schema';

/**
 * Repository Drizzle para busca de dados de produção.
 * Isola queries do Drizzle da lógica de negócio.
 *
 * Mapeamento:
 * - producaoleite -> dadoslactacao (ordenhas)
 * - vacinacao -> medicacoes (tipo_tratamento = 'Vacinação')
 * - pesagem -> dadoszootecnicos (com campo peso)
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

  /**
   * Busca vacinações programadas nos próximos X dias.
   * Usa dadossanitarios com join em medicacoes (tipo_tratamento = 'Vacinação').
   */
  async buscarVacinacoesprogramadas(diasAntecedencia: number, ids_bufalos?: string[]) {
    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + diasAntecedencia);

      const hojeStr = hoje.toISOString();
      const dataLimiteStr = dataLimite.toISOString();

      const conditions: any[] = [
        gte(dadossanitarios.dtAplicacao, hojeStr),
        lte(dadossanitarios.dtAplicacao, dataLimiteStr),
        isNull(dadossanitarios.deletedAt),
      ];

      if (ids_bufalos && ids_bufalos.length > 0) {
        conditions.push(inArray(dadossanitarios.idBufalo, ids_bufalos));
      }

      return await this.databaseService.db.query.dadossanitarios.findMany({
        where: and(...conditions),
        columns: {
          idSanit: true,
          dtAplicacao: true,
          idBufalo: true,
          doenca: true,
        },
        with: {
          medicacoe: {
            columns: {
              tipoTratamento: true,
              medicacao: true,
            },
            where: eq(medicacoes.tipoTratamento, 'Vacinação'),
          },
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ProducaoRepositoryDrizzle',
        method: 'buscarVacinacoesprogramadas',
        diasAntecedencia,
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar vacinações programadas: ${error.message}`);
    }
  }

  /**
   * Busca pesagens de um búfalo em período específico (dadoszootecnicos).
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
        repository: 'ProducaoRepositoryDrizzle',
        method: 'buscarPesagensRecentes',
        id_bufalo,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar pesagens recentes: ${error.message}`);
    }
  }
}
