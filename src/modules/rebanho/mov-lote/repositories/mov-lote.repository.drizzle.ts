import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { movlote, lote, grupo } from '../../../../database/schema';
import { CreateMovLoteDto } from '../dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from '../dto/update-mov-lote.dto';

@Injectable()
export class MovLoteRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateMovLoteDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(movlote)
        .values({
          idGrupo: dto.idGrupo,
          idLoteAnterior: dto.idLoteAnterior,
          idLoteAtual: dto.idLoteAtual,
          dtEntrada: dto.dtEntrada,
          idPropriedade: dto.idPropriedade,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[MovLoteRepository] Erro ao criar: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateMovLoteDto) {
    const data: any = {};
    if (dto.dtEntrada) data.dtEntrada = dto.dtEntrada;
    if (dto.dtSaida) data.dtSaida = dto.dtSaida;
    if (dto.idLoteAtual) data.idLoteAtual = dto.idLoteAtual;
    if (dto.idLoteAnterior) data.idLoteAnterior = dto.idLoteAnterior;

    const [result] = await this.databaseService.db.update(movlote).set(data).where(eq(movlote.idMovimento, id)).returning();
    return result || null;
  }

  async findById(id: string) {
    const [result] = await this.databaseService.db.select().from(movlote).where(eq(movlote.idMovimento, id)).limit(1);
    return result || null;
  }

  async findByPropriedade(idPropriedade: string, page: number, limit: number) {
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
  }

  async findHistoricoByGrupo(idGrupo: string) {
    return await this.databaseService.db.query.movlote.findMany({
      where: eq(movlote.idGrupo, idGrupo),
      orderBy: [desc(movlote.dtEntrada)],
      with: {
        lote_idLoteAnterior: { columns: { nomeLote: true } },
        lote_idLoteAtual: { columns: { nomeLote: true } },
      },
    });
  }

  async findStatusAtual(idGrupo: string) {
    return await this.databaseService.db.query.movlote.findFirst({
      where: and(eq(movlote.idGrupo, idGrupo), isNull(movlote.dtSaida)),
      orderBy: [desc(movlote.dtEntrada)],
      with: {
        lote_idLoteAtual: { columns: { nomeLote: true, idLote: true } },
      },
    });
  }

  async findRegistroAtual(idGrupo: string) {
    return await this.databaseService.db.query.movlote.findFirst({
      where: and(eq(movlote.idGrupo, idGrupo), isNull(movlote.dtSaida)),
    });
  }

  async checkIfExists(tableName: 'grupo' | 'lote', columnName: string, id: string) {
    const table = tableName === 'grupo' ? grupo : lote;
    const defaultColumn = tableName === 'grupo' ? grupo.idGrupo : lote.idLote;
    const dynamicColumn = tableName === 'grupo' ? (grupo as any)[columnName] : (lote as any)[columnName];
    const column = dynamicColumn ?? defaultColumn;

    const result = await this.databaseService.db.select({ id: column }).from(table).where(eq(column, id)).limit(1);

    return result.length > 0;
  }

  // NOTA: MovLote não usa soft delete, então o método remove é um hard delete
  async remove(id: string) {
    await this.databaseService.db.delete(movlote).where(eq(movlote.idMovimento, id));
    return true;
  }
}
