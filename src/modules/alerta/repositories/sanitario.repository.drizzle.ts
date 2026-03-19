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
          dtRetorno: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarTratamentosComRetorno',
        diasAntecedencia,
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar tratamentos com retorno: ${error.message}`);
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
      this.logger.logError(error, {
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarTratamentosRecentes',
        id_bufalo,
        diasAtras,
      });
      throw new InternalServerErrorException(`Erro ao buscar tratamentos recentes: ${error.message}`);
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
        repository: 'SanitarioRepositoryDrizzle',
        method: 'buscarVacinacoesProgramadas',
        diasAntecedencia,
        ids_bufalos,
      });
      throw new InternalServerErrorException(`Erro ao buscar vacinações programadas: ${error.message}`);
    }
  }
}
