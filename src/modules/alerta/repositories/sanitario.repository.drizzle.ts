import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, gte, lte, inArray, isNull } from 'drizzle-orm';
import { dadossanitarios, medicacoes } from 'src/database/schema';

/**
 * Repository Drizzle para busca de dados sanitários.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class SanitarioRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Busca tratamentos com retorno agendado nos próximos X dias.
   */
  async buscarTratamentosComRetorno(diasAntecedencia: number, ids_bufalos?: string[]) {
    try {
      const hoje = new Date();
      const dataInicio = new Date(hoje.toISOString().split('T')[0]);

      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + diasAntecedencia);

      const dataInicioStr = dataInicio.toISOString();
      const dataFimStr = dataFim.toISOString();

      const conditions: any[] = [
        eq(dadossanitarios.necessitaRetorno, true),
        gte(dadossanitarios.dtRetorno, dataInicioStr),
        lte(dadossanitarios.dtRetorno, dataFimStr),
      ];

      if (ids_bufalos && ids_bufalos.length > 0) {
        conditions.push(inArray(dadossanitarios.idBufalo, ids_bufalos));
      }

      return await this.databaseService.db.query.dadossanitarios.findMany({
        where: and(...conditions),
        columns: {
          idSanit: true,
          idBufalo: true,
          doenca: true,
          observacao: true,
          idMedicao: true,
          dtRetorno: true,
        },
        with: {
          medicacoe: {
            columns: {
              tipoTratamento: true,
              medicacao: true,
            },
          },
        },
      });
    } catch (error) {
      const normalizedError = this.toError(error);
      this.logger.logError(normalizedError, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarTratamentosComRetorno',
        diasAntecedencia,
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar tratamentos com retorno: ${normalizedError.message}`);
    }
  }

  /**
   * Busca múltiplos tratamentos de um búfalo em período específico.
   */
  async buscarTratamentosRecentes(id_bufalo: string, diasAtras: number) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      return await this.databaseService.db.query.dadossanitarios.findMany({
        where: and(eq(dadossanitarios.idBufalo, id_bufalo), gte(dadossanitarios.dtAplicacao, dataLimiteStr)),
        columns: {
          idSanit: true,
        },
      });
    } catch (error) {
      const normalizedError = this.toError(error);
      this.logger.logError(normalizedError, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarTratamentosRecentes',
        id_bufalo,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar tratamentos recentes: ${normalizedError.message}`);
    }
  }

  /**
   * Busca tratamentos recentes de múltiplos búfalos em uma única consulta.
   */
  async buscarTratamentosRecentesBatch(ids_bufalos: string[], diasAtras: number) {
    try {
      if (!ids_bufalos.length) {
        return [];
      }

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const dataLimiteStr = dataLimite.toISOString();

      return await this.databaseService.db.query.dadossanitarios.findMany({
        where: and(inArray(dadossanitarios.idBufalo, ids_bufalos), gte(dadossanitarios.dtAplicacao, dataLimiteStr)),
        columns: {
          idSanit: true,
          idBufalo: true,
        },
      });
    } catch (error) {
      const normalizedError = this.toError(error);
      this.logger.logError(normalizedError, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarTratamentosRecentesBatch',
        ids_bufalos,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar tratamentos recentes em lote: ${normalizedError.message}`);
    }
  }

  /**
   * Busca vacinações programadas nos próximos X dias.
   */
  async buscarVacinacoesProgramadas(diasAntecedencia: number, ids_bufalos?: string[]) {
    try {
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + diasAntecedencia);

      const hojeStr = hoje.toISOString();
      const dataLimiteStr = dataLimite.toISOString();

      const medicacoesVacinacao = await this.databaseService.db.query.medicacoes.findMany({
        where: and(eq(medicacoes.tipoTratamento, 'Vacinação'), isNull(medicacoes.deletedAt)),
        columns: {
          idMedicacao: true,
          medicacao: true,
        },
      });

      if (!medicacoesVacinacao.length) {
        return [];
      }

      const idsMedicacoesVacinacao = medicacoesVacinacao.map((medicacao) => medicacao.idMedicacao).filter((id): id is string => Boolean(id));

      if (!idsMedicacoesVacinacao.length) {
        return [];
      }

      const nomeVacinaPorMedicacao = new Map(
        medicacoesVacinacao
          .filter((medicacao) => Boolean(medicacao.idMedicacao))
          .map((medicacao) => [medicacao.idMedicacao as string, medicacao.medicacao ?? null]),
      );

      const conditions: any[] = [
        gte(dadossanitarios.dtAplicacao, hojeStr),
        lte(dadossanitarios.dtAplicacao, dataLimiteStr),
        isNull(dadossanitarios.deletedAt),
        inArray(dadossanitarios.idMedicao, idsMedicacoesVacinacao),
      ];

      if (ids_bufalos && ids_bufalos.length > 0) {
        conditions.push(inArray(dadossanitarios.idBufalo, ids_bufalos));
      }

      const vacinacoes = await this.databaseService.db.query.dadossanitarios.findMany({
        where: and(...conditions),
        columns: {
          idSanit: true,
          dtAplicacao: true,
          idBufalo: true,
          doenca: true,
          idMedicao: true,
        },
      });

      return vacinacoes.map((vacinacao) => ({
        ...vacinacao,
        tipoVacina: vacinacao.idMedicao ? (nomeVacinaPorMedicacao.get(vacinacao.idMedicao) ?? null) : null,
      }));
    } catch (error) {
      const normalizedError = this.toError(error);
      this.logger.logError(normalizedError, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarVacinacoesProgramadas',
        diasAntecedencia,
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar vacinações programadas: ${normalizedError.message}`);
    }
  }
}
