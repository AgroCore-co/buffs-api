import { Injectable } from '@nestjs/common';
import { count, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../core/database/database.service';
import {
  alertas,
  bufalo,
  ciclolactacao,
  dadosreproducao,
  dadossanitarios,
  dadoszootecnicos,
  grupo,
  materialgenetico,
  medicacoes,
  raca,
} from '../../../database/schema';

export interface SyncQueryResult<T = Record<string, unknown>> {
  data: T[];
  total: number;
  updatedAt: string | null;
}

@Injectable()
export class SyncRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listBufalosByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.bufalo.findMany({
        where: eq(bufalo.idPropriedade, idPropriedade),
        orderBy: [desc(bufalo.updatedAt), desc(bufalo.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(bufalo).where(eq(bufalo.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${bufalo.updatedAt})` })
        .from(bufalo)
        .where(eq(bufalo.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listLactacaoByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.ciclolactacao.findMany({
        where: eq(ciclolactacao.idPropriedade, idPropriedade),
        orderBy: [desc(ciclolactacao.updatedAt), desc(ciclolactacao.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(ciclolactacao).where(eq(ciclolactacao.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${ciclolactacao.updatedAt})` })
        .from(ciclolactacao)
        .where(eq(ciclolactacao.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listGruposByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.grupo.findMany({
        where: eq(grupo.idPropriedade, idPropriedade),
        orderBy: [desc(grupo.updatedAt), desc(grupo.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(grupo).where(eq(grupo.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${grupo.updatedAt})` })
        .from(grupo)
        .where(eq(grupo.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listRacas(limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.raca.findMany({
        orderBy: [desc(raca.updatedAt), desc(raca.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(raca),
      db.select({ updatedAt: sql<string | null>`MAX(${raca.updatedAt})` }).from(raca),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listDadosZootecnicosByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;
    const zootecColumns = getTableColumns(dadoszootecnicos);

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db
        .select({
          ...zootecColumns,
          idPropriedade: bufalo.idPropriedade,
        })
        .from(dadoszootecnicos)
        .innerJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade))
        .orderBy(desc(dadoszootecnicos.updatedAt), desc(dadoszootecnicos.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(dadoszootecnicos)
        .innerJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${dadoszootecnicos.updatedAt})` })
        .from(dadoszootecnicos)
        .innerJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listMedicamentosByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.medicacoes.findMany({
        where: eq(medicacoes.idPropriedade, idPropriedade),
        orderBy: [desc(medicacoes.updatedAt), desc(medicacoes.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(medicacoes).where(eq(medicacoes.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${medicacoes.updatedAt})` })
        .from(medicacoes)
        .where(eq(medicacoes.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listDadosSanitariosByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;
    const sanitariosColumns = getTableColumns(dadossanitarios);

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db
        .select({
          ...sanitariosColumns,
          idPropriedade: bufalo.idPropriedade,
        })
        .from(dadossanitarios)
        .innerJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade))
        .orderBy(desc(dadossanitarios.updatedAt), desc(dadossanitarios.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(dadossanitarios)
        .innerJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${dadossanitarios.updatedAt})` })
        .from(dadossanitarios)
        .innerJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
        .where(eq(bufalo.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listAlertasByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.alertas.findMany({
        where: eq(alertas.idPropriedade, idPropriedade),
        orderBy: [desc(alertas.updatedAt), desc(alertas.dataAlerta)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(alertas).where(eq(alertas.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${alertas.updatedAt})` })
        .from(alertas)
        .where(eq(alertas.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listCoberturasByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.dadosreproducao.findMany({
        where: eq(dadosreproducao.idPropriedade, idPropriedade),
        orderBy: [desc(dadosreproducao.updatedAt), desc(dadosreproducao.dtEvento)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(dadosreproducao).where(eq(dadosreproducao.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${dadosreproducao.updatedAt})` })
        .from(dadosreproducao)
        .where(eq(dadosreproducao.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }

  async listMaterialGeneticoByPropriedade(idPropriedade: string, limit: number, offset: number): Promise<SyncQueryResult> {
    const db = this.databaseService.db;

    const [data, totalResult, updatedAtResult] = await Promise.all([
      db.query.materialgenetico.findMany({
        where: eq(materialgenetico.idPropriedade, idPropriedade),
        orderBy: [desc(materialgenetico.updatedAt), desc(materialgenetico.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(materialgenetico).where(eq(materialgenetico.idPropriedade, idPropriedade)),
      db
        .select({ updatedAt: sql<string | null>`MAX(${materialgenetico.updatedAt})` })
        .from(materialgenetico)
        .where(eq(materialgenetico.idPropriedade, idPropriedade)),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
      updatedAt: updatedAtResult[0]?.updatedAt ?? null,
    };
  }
}
