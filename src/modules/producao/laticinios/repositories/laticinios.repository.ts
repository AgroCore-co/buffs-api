import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { industria } from '../../../../database/schema';
import { CreateLaticiniosDto, UpdateLaticiniosDto } from '../dto';

/**
 * Repository Drizzle para operações de Laticínios/Indústrias.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class LaticiniosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria nova indústria/laticínio
   */
  async criar(createDto: CreateLaticiniosDto) {
    const data = {
      nome: createDto.nome,
      representante: createDto.representante,
      contato: createDto.contato,
      observacao: createDto.observacao,
      idPropriedade: createDto.idPropriedade,
    };

    const [novaIndustria] = await this.databaseService.db.insert(industria).values(data).returning();
    return novaIndustria;
  }

  /**
   * Lista todas as indústrias (apenas registros ativos)
   */
  async listarTodas() {
    return await this.databaseService.db
      .select({
        idIndustria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        idPropriedade: industria.idPropriedade,
        createdAt: industria.createdAt,
        updatedAt: industria.updatedAt,
        deletedAt: industria.deletedAt,
      })
      .from(industria)
      .where(isNull(industria.deletedAt))
      .orderBy(desc(industria.createdAt));
  }

  /**
   * Lista indústrias de uma propriedade específica
   */
  async listarPorPropriedade(idPropriedade: string) {
    return await this.databaseService.db
      .select({
        idIndustria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        idPropriedade: industria.idPropriedade,
        createdAt: industria.createdAt,
        updatedAt: industria.updatedAt,
        deletedAt: industria.deletedAt,
      })
      .from(industria)
      .where(and(eq(industria.idPropriedade, idPropriedade), isNull(industria.deletedAt)))
      .orderBy(desc(industria.createdAt));
  }

  /**
   * Busca indústria por ID (apenas registros ativos)
   */
  async buscarPorId(idIndustria: string) {
    const resultado = await this.databaseService.db
      .select({
        idIndustria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        idPropriedade: industria.idPropriedade,
        createdAt: industria.createdAt,
        updatedAt: industria.updatedAt,
        deletedAt: industria.deletedAt,
      })
      .from(industria)
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  /**
   * Atualiza indústria existente
   */
  async atualizar(idIndustria: string, updateDto: UpdateLaticiniosDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.nome !== undefined) data.nome = updateDto.nome;
    if (updateDto.representante !== undefined) data.representante = updateDto.representante;
    if (updateDto.contato !== undefined) data.contato = updateDto.contato;
    if (updateDto.observacao !== undefined) data.observacao = updateDto.observacao;
    if (updateDto.idPropriedade !== undefined) data.idPropriedade = updateDto.idPropriedade;

    const [industriaAtualizada] = await this.databaseService.db
      .update(industria)
      .set(data)
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .returning();

    return industriaAtualizada;
  }

  /**
   * Soft delete de indústria
   */
  async softDelete(idIndustria: string) {
    const [resultado] = await this.databaseService.db
      .update(industria)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .returning();

    return resultado;
  }

  /**
   * Restaura indústria soft-deleted
   */
  async restaurar(idIndustria: string) {
    const [resultado] = await this.databaseService.db
      .update(industria)
      .set({ deletedAt: null })
      .where(eq(industria.idIndustria, idIndustria))
      .returning();

    return resultado;
  }

  /**
   * Lista todas as indústrias incluindo soft-deleted
   */
  async listarComDeletados() {
    return await this.databaseService.db
      .select({
        idIndustria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        idPropriedade: industria.idPropriedade,
        createdAt: industria.createdAt,
        updatedAt: industria.updatedAt,
        deletedAt: industria.deletedAt,
      })
      .from(industria)
      .orderBy(desc(industria.createdAt));
  }
}
