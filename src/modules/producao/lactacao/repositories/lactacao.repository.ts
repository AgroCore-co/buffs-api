import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, desc, isNull, sql, inArray } from 'drizzle-orm';
import { ciclolactacao } from '../../../../database/schema';

/**
 * Repository Drizzle para operações de Ciclo de Lactação.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class LactacaoRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria novo ciclo de lactação
   */
  async criar(data: any) {
    const insertData = {
      idBufala: data.idBufala,
      idPropriedade: data.idPropriedade,
      dtParto: data.dtParto,
      padraoDias: data.padraoDias,
      dtSecagemPrevista: data.dt_secagem_prevista,
      dtSecagemReal: data.dtSecagemReal,
      status: data.status,
      observacao: data.observacao,
    };

    const [novoCiclo] = await this.databaseService.db.insert(ciclolactacao).values(insertData).returning();
    return novoCiclo;
  }

  /**
   * Lista todos os ciclos com paginação (apenas registros ativos)
   */
  async listarTodos(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.databaseService.db
        .select()
        .from(ciclolactacao)
        .where(isNull(ciclolactacao.deletedAt))
        .orderBy(desc(ciclolactacao.dtParto))
        .limit(limit)
        .offset(offset),
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(ciclolactacao)
        .where(isNull(ciclolactacao.deletedAt)),
    ]);

    return { registros, total: count };
  }

  /**
   * Lista ciclos por propriedade com join em búfalo e raça
   */
  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const registros = await this.databaseService.db.query.ciclolactacao.findMany({
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

    const [{ count }] = await this.databaseService.db
      .select({ count: sql<number>`count(*)::int` })
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idPropriedade, idPropriedade), isNull(ciclolactacao.deletedAt)));

    return { registros, total: count };
  }

  /**
   * Lista ciclos de uma búfala específica
   */
  async listarPorBufala(idBufala: string) {
    return await this.databaseService.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idBufala, idBufala), isNull(ciclolactacao.deletedAt)))
      .orderBy(desc(ciclolactacao.dtParto));
  }

  /**
   * Busca ciclo por ID (apenas registros ativos)
   */
  async buscarPorId(idCicloLactacao: string) {
    const resultado = await this.databaseService.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Busca ciclo ativo de uma búfala (status 'Em Lactação')
   */
  async buscarCicloAtivo(idBufala: string) {
    const resultado = await this.databaseService.db
      .select()
      .from(ciclolactacao)
      .where(and(eq(ciclolactacao.idBufala, idBufala), eq(ciclolactacao.status, 'Em Lactação'), isNull(ciclolactacao.deletedAt)))
      .orderBy(desc(ciclolactacao.dtParto))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Busca ciclos ativos de múltiplas búfalas em uma única query (otimização N+1)
   * Retorna Map<idBufala, cicloAtivo>
   */
  async buscarCiclosAtivosPorBufalas(idsBufalas: string[]) {
    if (!idsBufalas || idsBufalas.length === 0) {
      return new Map();
    }

    const ciclos = await this.databaseService.db
      .select()
      .from(ciclolactacao)
      .where(and(inArray(ciclolactacao.idBufala, idsBufalas), eq(ciclolactacao.status, 'Em Lactação'), isNull(ciclolactacao.deletedAt)))
      .orderBy(desc(ciclolactacao.dtParto));

    // Agrupar por idBufala, mantendo apenas o mais recente (já ordenado por dtParto desc)
    const ciclosMap = new Map();
    for (const ciclo of ciclos) {
      if (!ciclosMap.has(ciclo.idBufala)) {
        ciclosMap.set(ciclo.idBufala, ciclo);
      }
    }

    return ciclosMap;
  }

  /**
   * Atualiza ciclo de lactação
   */
  async atualizar(idCicloLactacao: string, data: any) {
    const updateData: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (data.idBufala !== undefined) updateData.idBufala = data.idBufala;
    if (data.idPropriedade !== undefined) updateData.idPropriedade = data.idPropriedade;
    if (data.dtParto !== undefined) updateData.dtParto = data.dtParto;
    if (data.padraoDias !== undefined) updateData.padraoDias = data.padraoDias;
    if (data.dt_secagem_prevista !== undefined) updateData.dtSecagemPrevista = data.dt_secagem_prevista;
    if (data.dtSecagemReal !== undefined) updateData.dtSecagemReal = data.dtSecagemReal;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;

    const [cicloAtualizado] = await this.databaseService.db
      .update(ciclolactacao)
      .set(updateData)
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .returning();

    return cicloAtualizado;
  }

  /**
   * Soft delete de ciclo de lactação
   */
  async softDelete(idCicloLactacao: string) {
    const [resultado] = await this.databaseService.db
      .update(ciclolactacao)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(ciclolactacao.idCicloLactacao, idCicloLactacao), isNull(ciclolactacao.deletedAt)))
      .returning();

    return resultado;
  }

  /**
   * Restaura ciclo soft-deleted
   */
  async restaurar(idCicloLactacao: string) {
    const [resultado] = await this.databaseService.db
      .update(ciclolactacao)
      .set({ deletedAt: null })
      .where(eq(ciclolactacao.idCicloLactacao, idCicloLactacao))
      .returning();

    return resultado;
  }

  /**
   * Lista todos os ciclos incluindo soft-deleted
   */
  async listarComDeletados() {
    return await this.databaseService.db.select().from(ciclolactacao).orderBy(desc(ciclolactacao.dtParto));
  }

  /**
   * Retorna estatísticas de ciclos por propriedade
   */
  async getEstatisticasPropriedade(idPropriedade: string) {
    return await this.databaseService.db
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
