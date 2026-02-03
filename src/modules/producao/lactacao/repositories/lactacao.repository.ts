import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, desc, isNull, sql, asc } from 'drizzle-orm';
import { ciclolactacao, bufalo, raca } from '../../../../database/schema';

@Injectable()
export class LactacaoRepository {
  constructor(private readonly db: DatabaseService) {}

  async criar(data: any) {
    const insertData = {
      idBufala: data.id_bufala,
      idPropriedade: data.id_propriedade,
      dtParto: data.dt_parto,
      padraoDias: data.padrao_dias,
      dtSecagemPrevista: data.dt_secagem_prevista,
      dtSecagemReal: data.dt_secagem_real,
      status: data.status,
      observacao: data.observacao,
    };

    const [novoCiclo] = await this.db.db.insert(ciclolactacao).values(insertData).returning();
    return novoCiclo;
  }

  async listarTodos(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db.select().from(ciclolactacao).where(isNull(ciclolactacao.deletedAt)).orderBy(desc(ciclolactacao.dtParto)).limit(limit).offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(ciclolactacao)
        .where(isNull(ciclolactacao.deletedAt)),
    ]);

    return { registros, total: count };
  }

  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const registros = await this.db.db.query.ciclolactacao.findMany({
      where: and(eq(ciclolactacao.idPropriedade, idPropriedade), isNull(ciclolactacao.deletedAt)),
      orderBy: [sql`CASE WHEN ${ciclolactacao.status} = 'Em Lactação' THEN 0 ELSE 1 END`, desc(ciclolactacao.dtParto)],
      limit: limit,
      offset: offset,
      with: {
        bufalo: {
          columns: {
            nome: true,
            brinco: true,
            idBufalo: true,
          },
          with: {
            raca: {
              columns: {
                nome: true,
              },
            },
          },
        },
      },
    });

    const [{ count }] = await this.db.db
      .select({ count: sql<number>`count(*)::int` })
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idPropriedade, idPropriedade), isNull(ciclolactacao.deletedAt)));

    return { registros, total: count };
  }

  async listarPorBufala(idBufala: string) {
    return await this.db.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idBufala, idBufala), isNull(ciclolactacao.deletedAt)))
      .orderBy(desc(ciclolactacao.dtParto));
  }

  async buscarPorId(idCicloLactacao: string) {
    const resultado = await this.db.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async buscarCicloAtivo(idBufala: string) {
    const resultado = await this.db.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idBufala, idBufala), eq(ciclolactacao.status, 'Em Lactação'), isNull(ciclolactacao.deletedAt)))
      .orderBy(desc(ciclolactacao.dtParto))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async atualizar(idCicloLactacao: string, data: any) {
    const updateData: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (data.id_bufala !== undefined) updateData.idBufala = data.id_bufala;
    if (data.id_propriedade !== undefined) updateData.idPropriedade = data.id_propriedade;
    if (data.dt_parto !== undefined) updateData.dtParto = data.dt_parto;
    if (data.padrao_dias !== undefined) updateData.padraoDias = data.padrao_dias;
    if (data.dt_secagem_prevista !== undefined) updateData.dtSecagemPrevista = data.dt_secagem_prevista;
    if (data.dt_secagem_real !== undefined) updateData.dtSecagemReal = data.dt_secagem_real;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;

    const [cicloAtualizado] = await this.db.db
      .update(ciclolactacao)
      .set(updateData)
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .returning();

    return cicloAtualizado;
  }

  async softDelete(idCicloLactacao: string) {
    const [resultado] = await this.db.db
      .update(ciclolactacao)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .returning();

    return resultado;
  }

  async restaurar(idCicloLactacao: string) {
    const [resultado] = await this.db.db
      .update(ciclolactacao)
      .set({ deletedAt: null })
      .where(eq(ciclolactacao.idCicloLactacao, idCicloLactacao))
      .returning();

    return resultado;
  }

  async listarComDeletados() {
    return await this.db.db.select().from(ciclolactacao).orderBy(desc(ciclolactacao.dtParto));
  }

  async getEstatisticasPropriedade(idPropriedade: string) {
    return await this.db.db
      .select({
        idCicloLactacao: ciclolactacao.idCicloLactacao,
        dtParto: ciclolactacao.dtParto,
        dtSecagemReal: ciclolactacao.dtSecagemReal,
        dtSecagemPrevista: ciclolactacao.dtSecagemPrevista,
        status: ciclolactacao.status,
        padraoDias: ciclolactacao.padraoDias,
      })
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idPropriedade, idPropriedade), isNull(ciclolactacao.deletedAt)));
  }
}
