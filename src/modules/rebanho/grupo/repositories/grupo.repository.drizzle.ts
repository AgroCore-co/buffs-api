import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, desc, asc, sql, inArray } from 'drizzle-orm';
import { bufalo, grupo, lote, movlote } from '../../../../database/schema';
import { CreateGrupoDto } from '../dto/create-grupo.dto';
import { UpdateGrupoDto } from '../dto/update-grupo.dto';

@Injectable()
export class GrupoRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateGrupoDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(grupo)
        .values({
          nomeGrupo: dto.nomeGrupo,
          idPropriedade: dto.idPropriedade,
          color: dto.color,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[GrupoRepository] Erro ao criar: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateGrupoDto) {
    const data: any = {};
    if (dto.nomeGrupo) data.nomeGrupo = dto.nomeGrupo;
    if (dto.color) data.color = dto.color;
    if (dto.idPropriedade) data.idPropriedade = dto.idPropriedade;

    const [result] = await this.databaseService.db.update(grupo).set(data).where(eq(grupo.idGrupo, id)).returning();
    return result || null;
  }

  async findAll() {
    return await this.databaseService.db.query.grupo.findMany({
      where: isNull(grupo.deletedAt),
      orderBy: [asc(grupo.nomeGrupo)],
    });
  }

  async findByPropriedades(idPropriedades: string[]) {
    if (idPropriedades.length === 0) {
      return [];
    }

    return await this.databaseService.db.query.grupo.findMany({
      where: and(inArray(grupo.idPropriedade, idPropriedades), isNull(grupo.deletedAt)),
      orderBy: [asc(grupo.nomeGrupo)],
    });
  }

  async findById(id: string) {
    const [result] = await this.databaseService.db
      .select()
      .from(grupo)
      .where(and(eq(grupo.idGrupo, id), isNull(grupo.deletedAt)))
      .limit(1);
    return result || null;
  }

  async findByPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.databaseService.db.query.grupo.findMany({
        where: and(eq(grupo.idPropriedade, idPropriedade), isNull(grupo.deletedAt)),
        orderBy: [asc(grupo.nomeGrupo)],
        limit,
        offset,
        with: {
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      }),
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(grupo)
        .where(and(eq(grupo.idPropriedade, idPropriedade), isNull(grupo.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async countAnimaisByGrupoIds(idGrupos: string[]) {
    if (idGrupos.length === 0) {
      return [];
    }

    return await this.databaseService.db
      .select({
        idGrupo: bufalo.idGrupo,
        totalAnimaisGrupo: sql<number>`count(*)::int`,
      })
      .from(bufalo)
      .where(and(inArray(bufalo.idGrupo, idGrupos), isNull(bufalo.deletedAt)))
      .groupBy(bufalo.idGrupo);
  }

  async findPiqueteAtualByGrupoIds(idGrupos: string[]) {
    if (idGrupos.length === 0) {
      return [];
    }

    return await this.databaseService.db
      .select({
        idGrupo: movlote.idGrupo,
        idLote: lote.idLote,
        nomeLote: lote.nomeLote,
        dtEntrada: movlote.dtEntrada,
      })
      .from(movlote)
      .leftJoin(lote, and(eq(movlote.idLoteAtual, lote.idLote), isNull(lote.deletedAt)))
      .where(and(inArray(movlote.idGrupo, idGrupos), isNull(movlote.dtSaida), isNull(movlote.deletedAt)))
      .orderBy(desc(movlote.dtEntrada));
  }

  async findAnimaisByGrupoIds(idGrupos: string[]) {
    if (idGrupos.length === 0) {
      return [];
    }

    return await this.databaseService.db
      .select({
        idGrupo: bufalo.idGrupo,
        tag: bufalo.brinco,
        nome: bufalo.nome,
      })
      .from(bufalo)
      .where(and(inArray(bufalo.idGrupo, idGrupos), isNull(bufalo.deletedAt)))
      .orderBy(asc(bufalo.nome));
  }

  async findByIdWithDeleted(id: string) {
    return await this.databaseService.db.query.grupo.findFirst({
      where: eq(grupo.idGrupo, id),
    });
  }

  async findAllWithDeleted() {
    return await this.databaseService.db.query.grupo.findMany({
      orderBy: [desc(grupo.deletedAt), asc(grupo.nomeGrupo)],
    });
  }

  async findAllWithDeletedByPropriedades(idPropriedades: string[]) {
    if (idPropriedades.length === 0) {
      return [];
    }

    return await this.databaseService.db.query.grupo.findMany({
      where: inArray(grupo.idPropriedade, idPropriedades),
      orderBy: [desc(grupo.deletedAt), asc(grupo.nomeGrupo)],
    });
  }

  async softDelete(id: string) {
    const [result] = await this.databaseService.db
      .update(grupo)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(grupo.idGrupo, id))
      .returning();
    return result || null;
  }

  async restore(id: string) {
    const [result] = await this.databaseService.db.update(grupo).set({ deletedAt: null }).where(eq(grupo.idGrupo, id)).returning();
    return result || null;
  }
}
