import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, lte, desc } from 'drizzle-orm';
import { dadosreproducao } from 'src/database/schema';

/**
 * Repository Drizzle para busca de dados de reprodução.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class ReproducaoRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca coberturas confirmadas (gestações) de uma propriedade ou todas.
   */
  async buscarGestacoesConfirmadas(id_propriedade?: string) {
    try {
      const conditions = [eq(dadosreproducao.status, 'Confirmada')];

      if (id_propriedade) {
        conditions.push(eq(dadosreproducao.idPropriedade, id_propriedade));
      }

      return await this.databaseService.db.query.dadosreproducao.findMany({
        where: conditions.length > 1 ? and(...conditions) : conditions[0],
        columns: {
          idReproducao: true,
          dtEvento: true,
          idBufala: true,
          idPropriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ReproducaoRepositoryDrizzle',
        method: 'buscarGestacoesConfirmadas',
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar gestações confirmadas: ${error.message}`);
    }
  }

  /**
   * Busca coberturas sem diagnóstico há mais de X dias.
   */
  async buscarCoberturasSemDiagnostico(diasMinimos: number, id_propriedade?: string) {
    try {
      const hoje = new Date();
      const dataLimite = new Date(hoje.getTime() - diasMinimos * 24 * 60 * 60 * 1000);
      const dataLimiteStr = dataLimite.toISOString();

      const conditions: any[] = [eq(dadosreproducao.status, 'Em andamento'), lte(dadosreproducao.dtEvento, dataLimiteStr)];

      if (id_propriedade) {
        conditions.push(eq(dadosreproducao.idPropriedade, id_propriedade));
      }

      return await this.databaseService.db.query.dadosreproducao.findMany({
        where: and(...conditions),
        columns: {
          idReproducao: true,
          dtEvento: true,
          idBufala: true,
          idPropriedade: true,
          tipoInseminacao: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ReproducaoRepositoryDrizzle',
        method: 'buscarCoberturasSemDiagnostico',
        diasMinimos,
        id_propriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar coberturas sem diagnóstico: ${error.message}`);
    }
  }

  /**
   * Busca última cobertura de uma búfala específica.
   */
  async buscarUltimaCobertura(id_bufala: string) {
    try {
      return await this.databaseService.db.query.dadosreproducao.findFirst({
        where: eq(dadosreproducao.idBufala, id_bufala),
        columns: {
          dtEvento: true,
          status: true,
        },
        orderBy: [desc(dadosreproducao.dtEvento)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'ReproducaoRepositoryDrizzle',
        method: 'buscarUltimaCobertura',
        id_bufala,
      });
      throw new InternalServerErrorException(`Erro ao buscar última cobertura: ${error.message}`);
    }
  }
}
