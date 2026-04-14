import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, inArray, isNull, sql } from 'drizzle-orm';
import { coleta, industria } from '../../../../database/schema';
import { CreateRetiradaDto, UpdateRetiradaDto } from '../dto';

/**
 * Repository Drizzle para operações de Coleta/Retirada de Leite.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class RetiradaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria nova coleta de leite
   * @throws {BadRequestException} Se FK não existir (funcionário, indústria ou propriedade)
   */
  async criar(createDto: CreateRetiradaDto, idFuncionario: string) {
    try {
      const [novaColeta] = await this.databaseService.db
        .insert(coleta)
        .values({
          idIndustria: createDto.idIndustria,
          idPropriedade: createDto.idPropriedade,
          resultadoTeste: createDto.resultadoTeste,
          observacao: createDto.observacao,
          quantidade: createDto.quantidade?.toString(),
          dtColeta: createDto.dtColeta,
          idFuncionario,
        })
        .returning();
      return novaColeta;
    } catch (error) {
      // Foreign key violation - indica dados inválidos do cliente
      if (error.cause?.code === '23503') {
        const detail = error.cause.detail || '';
        if (detail.includes('id_funcionario')) {
          throw new BadRequestException(`Funcionário com ID ${idFuncionario} não existe no sistema`);
        }
        if (detail.includes('id_industria')) {
          throw new BadRequestException(`Indústria com ID ${createDto.idIndustria} não existe no sistema`);
        }
        if (detail.includes('id_propriedade')) {
          throw new BadRequestException(`Propriedade com ID ${createDto.idPropriedade} não existe no sistema`);
        }
      }
      throw new InternalServerErrorException(`[RetiradaRepository] Erro ao criar coleta: ${error.message}`);
    }
  }

  /**
   * Lista todas as coletas com paginação (apenas registros ativos)
   */
  async listarTodas(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.databaseService.db.select().from(coleta).where(isNull(coleta.deletedAt)).orderBy(desc(coleta.dtColeta)).limit(limit).offset(offset),
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(coleta)
        .where(isNull(coleta.deletedAt)),
    ]);

    return { registros, total: count };
  }

  /**
   * Lista coletas de uma propriedade com join na indústria
   */
  async listarPorPropriedade(idPropriedade: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [registros, [{ count }]] = await Promise.all([
      this.databaseService.db
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
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(coleta)
        .where(and(eq(coleta.idPropriedade, idPropriedade), isNull(coleta.deletedAt))),
    ]);

    return { registros, total: count };
  }

  async obterEstatisticasPorPropriedade(idPropriedade: string) {
    const resultados = await this.databaseService.db
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

  /**
   * Busca coleta por ID (apenas registros ativos)
   */
  async buscarPorId(idColeta: string) {
    const resultado = await this.databaseService.db
      .select()
      .from(coleta)
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async buscarPorIdComDeletados(idColeta: string) {
    const resultado = await this.databaseService.db.select().from(coleta).where(eq(coleta.idColeta, idColeta)).limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Atualiza coleta existente
   */
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

    const [coletaAtualizada] = await this.databaseService.db
      .update(coleta)
      .set(data)
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .returning();

    return coletaAtualizada;
  }

  /**
   * Soft delete de coleta
   */
  async softDelete(idColeta: string) {
    const [resultado] = await this.databaseService.db
      .update(coleta)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(coleta.idColeta, idColeta), isNull(coleta.deletedAt)))
      .returning();

    return resultado;
  }

  /**
   * Restaura coleta soft-deleted
   */
  async restaurar(idColeta: string) {
    const [resultado] = await this.databaseService.db.update(coleta).set({ deletedAt: null }).where(eq(coleta.idColeta, idColeta)).returning();

    return resultado;
  }

  /**
   * Lista todas as coletas incluindo soft-deleted
   */
  async listarComDeletados() {
    return await this.databaseService.db.select().from(coleta).orderBy(desc(coleta.dtColeta));
  }

  async listarComDeletadosPorPropriedades(idsPropriedades: string[]) {
    if (!idsPropriedades.length) {
      return [];
    }

    return await this.databaseService.db.select().from(coleta).where(inArray(coleta.idPropriedade, idsPropriedades)).orderBy(desc(coleta.dtColeta));
  }
}
