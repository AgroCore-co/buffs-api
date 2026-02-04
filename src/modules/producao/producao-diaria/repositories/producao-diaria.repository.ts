import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { estoqueleite } from '../../../../database/schema';
import { CreateProducaoDiariaDto, UpdateProducaoDiariaDto } from '../dto';
import { PaginationDto } from '../../../../core/dto';

@Injectable()
export class ProducaoDiariaRepository {
  constructor(private readonly db: DatabaseService) {}

  async criar(createDto: CreateProducaoDiariaDto) {
    const data = {
      idPropriedade: createDto.idPropriedade,
      idUsuario: createDto.idUsuario,
      quantidade: String(createDto.quantidade),
      dtRegistro: createDto.dtRegistro || sql`now()`,
      observacao: createDto.observacao,
    };

    const [novoEstoque] = await this.db.db.insert(estoqueleite).values(data).returning();
    return novoEstoque;
  }

  async listarTodos(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db.select().from(estoqueleite).where(isNull(estoqueleite.deletedAt)).orderBy(desc(estoqueleite.dtRegistro)).limit(limit).offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(estoqueleite)
        .where(isNull(estoqueleite.deletedAt)),
    ]);

    return { registros, total: count };
  }

  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.db.db
        .select()
        .from(estoqueleite)
        .where(and(eq(estoqueleite.idPropriedade, idPropriedade), isNull(estoqueleite.deletedAt)))
        .orderBy(desc(estoqueleite.dtRegistro))
        .limit(limit)
        .offset(offset),
      this.db.db
        .select({ count: sql<number>`count(*)::int` })
        .from(estoqueleite)
        .where(and(eq(estoqueleite.idPropriedade, idPropriedade), isNull(estoqueleite.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async buscarPorId(idEstoque: string) {
    const resultado = await this.db.db
      .select()
      .from(estoqueleite)
      .where(and(eq(estoqueleite.idEstoque, idEstoque), isNull(estoqueleite.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async atualizar(idEstoque: string, updateDto: UpdateProducaoDiariaDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.idPropriedade !== undefined) data.idPropriedade = updateDto.idPropriedade;
    if (updateDto.idUsuario !== undefined) data.idUsuario = updateDto.idUsuario;
    if (updateDto.quantidade !== undefined) data.quantidade = String(updateDto.quantidade);
    if (updateDto.dtRegistro !== undefined) data.dtRegistro = updateDto.dtRegistro;
    if (updateDto.observacao !== undefined) data.observacao = updateDto.observacao;

    const [estoqueAtualizado] = await this.db.db
      .update(estoqueleite)
      .set(data)
      .where(and(eq(estoqueleite.idEstoque, idEstoque), isNull(estoqueleite.deletedAt)))
      .returning();

    return estoqueAtualizado;
  }

  async softDelete(idEstoque: string) {
    const [resultado] = await this.db.db
      .update(estoqueleite)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(estoqueleite.idEstoque, idEstoque), isNull(estoqueleite.deletedAt)))
      .returning();

    return resultado;
  }

  async restaurar(idEstoque: string) {
    const [resultado] = await this.db.db.update(estoqueleite).set({ deletedAt: null }).where(eq(estoqueleite.idEstoque, idEstoque)).returning();

    return resultado;
  }

  async listarComDeletados() {
    return await this.db.db.select().from(estoqueleite).orderBy(desc(estoqueleite.dtRegistro));
  }
}
