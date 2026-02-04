import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { coleta, industria } from '../../../../database/schema';
import { CreateRetiradaDto, UpdateRetiradaDto } from '../dto';
import { sanitizeForDrizzle } from '../../../../core/utils';

@Injectable()
export class RetiradaRepository {
  constructor(private readonly db: DatabaseService) {}

  async criar(createDto: CreateRetiradaDto, idFuncionario: string) {
    const data = sanitizeForDrizzle({
      idIndustria: createDto.idIndustria,
      idPropriedade: createDto.idPropriedade,
      resultadoTeste: createDto.resultadoTeste,
      observacao: createDto.observacao,
      quantidade: createDto.quantidade !== undefined ? String(createDto.quantidade) : undefined,
      dtColeta: createDto.dtColeta || sql`now()`,
      idFuncionario,
    });

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

  async atualizar(idColeta: string, updateDto: UpdateRetiradaDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.idIndustria !== undefined) data.idIndustria = updateDto.idIndustria;
    if (updateDto.idPropriedade !== undefined) data.idPropriedade = updateDto.idPropriedade;
    if (updateDto.resultadoTeste !== undefined) data.resultadoTeste = updateDto.resultadoTeste;
    if (updateDto.observacao !== undefined) data.observacao = updateDto.observacao;
    if (updateDto.quantidade !== undefined) data.quantidade = String(updateDto.quantidade);
    if (updateDto.dtColeta !== undefined) data.dtColeta = updateDto.dtColeta;

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
