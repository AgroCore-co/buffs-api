import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { coleta, industria } from '../../../../database/schema';
import { CreateColetaDto, UpdateColetaDto } from '../dto';

@Injectable()
export class RetiradaRepository {
  constructor(private readonly db: DatabaseService) {}

  async criar(createDto: CreateColetaDto, idFuncionario: string) {
    const data = {
      idIndustria: createDto.id_industria,
      idPropriedade: createDto.id_propriedade,
      resultadoTeste: createDto.resultado_teste,
      observacao: createDto.observacao,
      quantidade: createDto.quantidade !== undefined ? String(createDto.quantidade) : undefined,
      dtColeta: createDto.dt_coleta || sql`now()`,
      idFuncionario,
    };

    const [novaColeta] = await this.db.db.insert(coleta).values(data).returning();
    return novaColeta;
  }

  async listarTodas(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db.select().from(coleta).where(isNull(coleta.deletedAt)).orderBy(desc(coleta.dtColeta)).limit(limit).offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(coleta)
        .where(isNull(coleta.deletedAt)),
    ]);

    return { registros, total: count };
  }

  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db
        .select({
          coleta: coleta,
          industria: industria,
        })
        .from(coleta)
        .leftJoin(industria, eq(coleta.idIndustria, industria.idIndustria))
        .where(and(eq(coleta.idPropriedade, idPropriedade), isNull(coleta.deletedAt)))
        .orderBy(desc(coleta.dtColeta))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(coleta)
        .where(and(eq(coleta.idPropriedade, idPropriedade), isNull(coleta.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async obterEstatisticasPorPropriedade(idPropriedade: string) {
    const resultados = await this.db.db
      .select({
        resultadoTeste: coleta.resultadoTeste,
        count: sql<number>`count(*)::int`,
      })
      .from(coleta)
      .where(and(eq(coleta.idPropriedade, idPropriedade), isNull(coleta.deletedAt)))
      .groupBy(coleta.resultadoTeste);

    const aprovadas = resultados.find((r) => r.resultadoTeste === true)?.count || 0;
    const rejeitadas = resultados.find((r) => r.resultadoTeste === false)?.count || 0;

    return { aprovadas, rejeitadas };
  }

  async buscarPorId(idColeta: string) {
    const resultado = await this.db.db
      .select()
      .from(coleta)
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async atualizar(idColeta: string, updateDto: UpdateColetaDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.id_industria !== undefined) data.idIndustria = updateDto.id_industria;
    if (updateDto.id_propriedade !== undefined) data.idPropriedade = updateDto.id_propriedade;
    if (updateDto.resultado_teste !== undefined) data.resultadoTeste = updateDto.resultado_teste;
    if (updateDto.observacao !== undefined) data.observacao = updateDto.observacao;
    if (updateDto.quantidade !== undefined) data.quantidade = String(updateDto.quantidade);
    if (updateDto.dt_coleta !== undefined) data.dtColeta = updateDto.dt_coleta;

    const [coletaAtualizada] = await this.db.db
      .update(coleta)
      .set(data)
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .returning();

    return coletaAtualizada;
  }

  async softDelete(idColeta: string) {
    const [resultado] = await this.db.db
      .update(coleta)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .returning();

    return resultado;
  }

  async restaurar(idColeta: string) {
    const [resultado] = await this.db.db.update(coleta).set({ deletedAt: null }).where(eq(coleta.idColeta, idColeta)).returning();

    return resultado;
  }

  async listarComDeletados() {
    return await this.db.db.select().from(coleta).orderBy(desc(coleta.dtColeta));
  }
}
