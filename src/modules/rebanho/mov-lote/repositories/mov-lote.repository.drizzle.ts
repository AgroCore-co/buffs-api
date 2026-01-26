import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import { movlote, lote, grupo } from '../../../../database/schema';
import { CreateMovLoteDto } from '../dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from '../dto/update-mov-lote.dto';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class MovLoteRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  async create(createMovLoteDto: CreateMovLoteDto) {
    try {
      const [novoMovimento] = await this.databaseService.db
        .insert(movlote)
        .values({
          idGrupo: createMovLoteDto.id_grupo,
          idLoteAnterior: createMovLoteDto.id_lote_anterior,
          idLoteAtual: createMovLoteDto.id_lote_atual,
          dtEntrada: createMovLoteDto.dt_entrada,
          idPropriedade: createMovLoteDto.id_propriedade,
        })
        .returning();
      return novoMovimento;
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'create' });
      throw new InternalServerErrorException(`Erro ao criar movimentação de lote: ${error.message}`);
    }
  }

  async findById(id: string) {
    try {
      return await this.databaseService.db.query.movlote.findFirst({
        where: eq(movlote.idMovimento, id),
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'findById' });
      throw new InternalServerErrorException(`Erro ao buscar movimentação de lote: ${error.message}`);
    }
  }

  async findByPropriedade(idPropriedade: string, page: number, limit: number) {
    try {
      const offset = (page - 1) * limit;

      const [registros, [{ count }]] = await Promise.all([
        this.databaseService.db.query.movlote.findMany({
          where: eq(movlote.idPropriedade, idPropriedade),
          orderBy: [desc(movlote.dtEntrada)],
          limit,
          offset,
          with: {
            grupo: { columns: { nomeGrupo: true } },
            lote_idLoteAnterior: { columns: { nomeLote: true } },
            lote_idLoteAtual: { columns: { nomeLote: true } },
          },
        }),
        this.databaseService.db
          .select({ count: sql<number>`count(*)::int` })
          .from(movlote)
          .where(eq(movlote.idPropriedade, idPropriedade)),
      ]);

      return { registros, total: count };
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'findByPropriedade' });
      throw new InternalServerErrorException(`Erro ao buscar movimentações da propriedade: ${error.message}`);
    }
  }

  async findHistoricoByGrupo(idGrupo: string) {
    try {
      return await this.databaseService.db.query.movlote.findMany({
        where: eq(movlote.idGrupo, idGrupo),
        orderBy: [desc(movlote.dtEntrada)],
        with: {
          lote_idLoteAnterior: { columns: { nomeLote: true } },
          lote_idLoteAtual: { columns: { nomeLote: true } },
        },
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'findHistoricoByGrupo' });
      throw new InternalServerErrorException(`Erro ao buscar histórico do grupo: ${error.message}`);
    }
  }

  async findStatusAtual(idGrupo: string) {
    try {
      return await this.databaseService.db.query.movlote.findFirst({
        where: and(eq(movlote.idGrupo, idGrupo), isNull(movlote.dtSaida)),
        orderBy: [desc(movlote.dtEntrada)],
        with: {
          lote_idLoteAtual: { columns: { nomeLote: true, idLote: true } },
        },
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'findStatusAtual' });
      throw new InternalServerErrorException(`Erro ao buscar status atual do grupo: ${error.message}`);
    }
  }

  async update(id: string, updateMovLoteDto: UpdateMovLoteDto) {
    try {
      const data: any = { updatedAt: new Date().toISOString() };
      if (updateMovLoteDto.dt_entrada) data.dtEntrada = updateMovLoteDto.dt_entrada;
      if (updateMovLoteDto.dt_saida) data.dtSaida = updateMovLoteDto.dt_saida;
      if (updateMovLoteDto.id_lote_atual) data.idLoteAtual = updateMovLoteDto.id_lote_atual;
      if (updateMovLoteDto.id_lote_anterior) data.idLoteAnterior = updateMovLoteDto.id_lote_anterior;

      const [movimentoAtualizado] = await this.databaseService.db.update(movlote).set(data).where(eq(movlote.idMovimento, id)).returning();

      return movimentoAtualizado;
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'update' });
      throw new InternalServerErrorException(`Erro ao atualizar movimentação: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.databaseService.db.delete(movlote).where(eq(movlote.idMovimento, id));
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'remove' });
      throw new InternalServerErrorException(`Erro ao remover movimentação: ${error.message}`);
    }
  }

  async findRegistroAtual(idGrupo: string) {
    try {
      return await this.databaseService.db.query.movlote.findFirst({
        where: and(eq(movlote.idGrupo, idGrupo), isNull(movlote.dtSaida)),
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'findRegistroAtual' });
      throw new InternalServerErrorException(`Erro ao buscar registro atual: ${error.message}`);
    }
  }

  async checkIfExists(tableName: 'grupo' | 'lote', columnName: string, id: string) {
    try {
      const table = tableName === 'grupo' ? grupo : lote;
      const defaultColumn = tableName === 'grupo' ? grupo.idGrupo : lote.idLote;
      const dynamicColumn =
        tableName === 'grupo'
          ? (grupo as any)[columnName]
          : (lote as any)[columnName];
      const column = dynamicColumn ?? defaultColumn;

      const result = await this.databaseService.db
        .select({ id: column })
        .from(table)
        .where(eq(column, id))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      this.logger.logError(error, { repository: 'MovLoteRepositoryDrizzle', method: 'checkIfExists' });
      throw new InternalServerErrorException(`Erro ao verificar existência: ${error.message}`);
    }
  }
}
