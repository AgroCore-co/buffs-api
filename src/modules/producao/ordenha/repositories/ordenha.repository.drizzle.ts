import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, asc, gte, isNull, inArray, sql } from 'drizzle-orm';
import { dadoslactacao } from '../../../../database/schema';
import { CreateDadosLactacaoDto, UpdateDadosLactacaoDto } from '../dto';

@Injectable()
export class OrdenhaRepositoryDrizzle {
  constructor(private readonly db: DatabaseService) {}

  async criar(createDto: CreateDadosLactacaoDto, idUsuario: string) {
    const data = {
      idBufala: createDto.idBufala,
      idUsuario: idUsuario,
      idCicloLactacao: createDto.idCicloLactacao,
      idPropriedade: createDto.idPropriedade,
      qtOrdenha: createDto.qtOrdenha !== undefined ? String(createDto.qtOrdenha) : undefined,
      periodo: createDto.periodo,
      ocorrencia: createDto.ocorrencia,
      dtOrdenha: createDto.dtOrdenha || sql`now()`,
    };

    const [novoDado] = await this.db.db.insert(dadoslactacao).values(data).returning();
    return novoDado;
  }

  async listarTodos(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db
        .select()
        .from(dadoslactacao)
        .where(isNull(dadoslactacao.deletedAt))
        .orderBy(desc(dadoslactacao.dtOrdenha))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(dadoslactacao)
        .where(isNull(dadoslactacao.deletedAt)),
    ]);

    return { registros, total: count };
  }

  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db
        .select()
        .from(dadoslactacao)
        .where(and(eq(dadoslactacao.idPropriedade, idPropriedade), isNull(dadoslactacao.deletedAt)))
        .orderBy(desc(dadoslactacao.dtOrdenha))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(dadoslactacao)
        .where(and(eq(dadoslactacao.idPropriedade, idPropriedade), isNull(dadoslactacao.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async listarPorBufala(idBufala: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const registros = await this.db.db.query.dadoslactacao.findMany({
      where: and(eq(dadoslactacao.idBufala, idBufala), isNull(dadoslactacao.deletedAt)),
      orderBy: [desc(dadoslactacao.dtOrdenha)],
      limit,
      offset,
      with: {
        bufalo: { columns: { idBufalo: true, nome: true, brinco: true } },
        usuario: { columns: { idUsuario: true, nome: true } },
      },
    });

    const [{ count }] = await this.db.db
      .select({ count: sql<number>`count(*)::int` })
      .from(dadoslactacao)
      .where(and(eq(dadoslactacao.idBufala, idBufala), isNull(dadoslactacao.deletedAt)));

    return { registros, total: count };
  }

  async listarPorCiclo(idCicloLactacao: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db
        .select()
        .from(dadoslactacao)
        .where(and(eq(dadoslactacao.idCicloLactacao, idCicloLactacao), isNull(dadoslactacao.deletedAt)))
        .orderBy(desc(dadoslactacao.dtOrdenha))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(dadoslactacao)
        .where(and(eq(dadoslactacao.idCicloLactacao, idCicloLactacao), isNull(dadoslactacao.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async listarTodosPorCiclo(idCicloLactacao: string) {
    return await this.db.db
      .select()
      .from(dadoslactacao)
      .where(and(eq(dadoslactacao.idCicloLactacao, idCicloLactacao), isNull(dadoslactacao.deletedAt)))
      .orderBy(desc(dadoslactacao.dtOrdenha));
  }

  async obterEstatisticasPorCiclos(idsCiclos: string[]) {
    if (!idsCiclos.length) {
      return new Map<
        string,
        {
          totalProduzido: number;
          totalOrdenhas: number;
          ultimaOrdenha: { data: string; quantidade: number; periodo: string | null } | null;
        }
      >();
    }

    const [totais, ultimasOrdenhas] = await Promise.all([
      this.db.db
        .select({
          idCicloLactacao: dadoslactacao.idCicloLactacao,
          totalProduzido: sql<number>`coalesce(sum(${dadoslactacao.qtOrdenha}), 0)`,
          totalOrdenhas: sql<number>`count(*)::int`,
        })
        .from(dadoslactacao)
        .where(and(inArray(dadoslactacao.idCicloLactacao, idsCiclos), isNull(dadoslactacao.deletedAt)))
        .groupBy(dadoslactacao.idCicloLactacao),
      this.db.db
        .selectDistinctOn([dadoslactacao.idCicloLactacao], {
          idCicloLactacao: dadoslactacao.idCicloLactacao,
          dtOrdenha: dadoslactacao.dtOrdenha,
          qtOrdenha: dadoslactacao.qtOrdenha,
          periodo: dadoslactacao.periodo,
        })
        .from(dadoslactacao)
        .where(and(inArray(dadoslactacao.idCicloLactacao, idsCiclos), isNull(dadoslactacao.deletedAt)))
        .orderBy(dadoslactacao.idCicloLactacao, desc(dadoslactacao.dtOrdenha)),
    ]);

    const ultimasOrdenhasMap = new Map<
      string,
      {
        data: string;
        quantidade: number;
        periodo: string | null;
      }
    >();

    for (const ultima of ultimasOrdenhas) {
      if (!ultima.idCicloLactacao || !ultima.dtOrdenha) continue;

      ultimasOrdenhasMap.set(ultima.idCicloLactacao, {
        data: ultima.dtOrdenha,
        quantidade: Number(ultima.qtOrdenha) || 0,
        periodo: ultima.periodo,
      });
    }

    const estatisticasMap = new Map<
      string,
      {
        totalProduzido: number;
        totalOrdenhas: number;
        ultimaOrdenha: { data: string; quantidade: number; periodo: string | null } | null;
      }
    >();

    for (const total of totais) {
      if (!total.idCicloLactacao) continue;

      estatisticasMap.set(total.idCicloLactacao, {
        totalProduzido: Number(total.totalProduzido) || 0,
        totalOrdenhas: total.totalOrdenhas || 0,
        ultimaOrdenha: ultimasOrdenhasMap.get(total.idCicloLactacao) ?? null,
      });
    }

    return estatisticasMap;
  }

  async listarRecentesPorBufala(idBufala: string, dataInicio: Date) {
    return await this.db.db
      .select({ dtOrdenha: dadoslactacao.dtOrdenha, qtOrdenha: dadoslactacao.qtOrdenha })
      .from(dadoslactacao)
      .where(and(eq(dadoslactacao.idBufala, idBufala), gte(dadoslactacao.dtOrdenha, dataInicio.toISOString()), isNull(dadoslactacao.deletedAt)))
      .orderBy(asc(dadoslactacao.dtOrdenha));
  }

  async buscarPorId(idLact: string) {
    const resultado = await this.db.db
      .select()
      .from(dadoslactacao)
      .where(and(eq(dadoslactacao.idLact, idLact), isNull(dadoslactacao.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async buscarPorIdComDeletados(idLact: string) {
    const resultado = await this.db.db.select().from(dadoslactacao).where(eq(dadoslactacao.idLact, idLact)).limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async atualizar(idLact: string, updateDto: UpdateDadosLactacaoDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.idBufala !== undefined) data.idBufala = updateDto.idBufala;
    if (updateDto.idCicloLactacao !== undefined) data.idCicloLactacao = updateDto.idCicloLactacao;
    if (updateDto.idPropriedade !== undefined) data.idPropriedade = updateDto.idPropriedade;
    if (updateDto.qtOrdenha !== undefined) data.qtOrdenha = String(updateDto.qtOrdenha);
    if (updateDto.periodo !== undefined) data.periodo = updateDto.periodo;
    if (updateDto.ocorrencia !== undefined) data.ocorrencia = updateDto.ocorrencia;
    if (updateDto.dtOrdenha !== undefined) data.dtOrdenha = updateDto.dtOrdenha;

    const [dadoAtualizado] = await this.db.db
      .update(dadoslactacao)
      .set(data)
      .where(and(eq(dadoslactacao.idLact, idLact), isNull(dadoslactacao.deletedAt)))
      .returning();

    return dadoAtualizado;
  }

  async softDelete(idLact: string) {
    const [resultado] = await this.db.db
      .update(dadoslactacao)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(dadoslactacao.idLact, idLact), isNull(dadoslactacao.deletedAt)))
      .returning();

    return resultado;
  }

  async restaurar(idLact: string) {
    const [resultado] = await this.db.db.update(dadoslactacao).set({ deletedAt: null }).where(eq(dadoslactacao.idLact, idLact)).returning();

    return resultado;
  }

  async listarComDeletados() {
    return await this.db.db.select().from(dadoslactacao).orderBy(desc(dadoslactacao.dtOrdenha));
  }

  async listarComDeletadosPorPropriedades(idsPropriedades: string[]) {
    if (!idsPropriedades.length) {
      return [];
    }

    return await this.db.db
      .select()
      .from(dadoslactacao)
      .where(inArray(dadoslactacao.idPropriedade, idsPropriedades))
      .orderBy(desc(dadoslactacao.dtOrdenha));
  }
}
