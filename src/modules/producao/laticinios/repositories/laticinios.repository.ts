import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { industria } from '../../../../database/schema';
import { CreateLaticiniosDto, UpdateLaticiniosDto } from '../dto';

@Injectable()
export class LaticiniosRepository {
  constructor(private readonly db: DatabaseService) {}

  async criar(createDto: CreateLaticiniosDto) {
    const data = {
      nome: createDto.nome,
      representante: createDto.representante,
      contato: createDto.contato,
      observacao: createDto.observacao,
      idPropriedade: createDto.id_propriedade,
    };

    const [novaIndustria] = await this.db.db.insert(industria).values(data).returning();
    return novaIndustria;
  }

  async listarTodas() {
    return await this.db.db.select().from(industria).where(isNull(industria.deletedAt)).orderBy(desc(industria.createdAt));
  }

  async listarPorPropriedade(idPropriedade: string) {
    return await this.db.db
      .select()
      .from(industria)
      .where(and(eq(industria.idPropriedade, idPropriedade), isNull(industria.deletedAt)))
      .orderBy(desc(industria.createdAt));
  }

  async buscarPorId(idIndustria: string) {
    const resultado = await this.db.db
      .select()
      .from(industria)
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }

  async atualizar(idIndustria: string, updateDto: UpdateLaticiniosDto) {
    const data: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (updateDto.nome !== undefined) data.nome = updateDto.nome;
    if (updateDto.representante !== undefined) data.representante = updateDto.representante;
    if (updateDto.contato !== undefined) data.contato = updateDto.contato;
    if (updateDto.observacao !== undefined) data.observacao = updateDto.observacao;
    if (updateDto.id_propriedade !== undefined) data.idPropriedade = updateDto.id_propriedade;

    const [industriaAtualizada] = await this.db.db
      .update(industria)
      .set(data)
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .returning();

    return industriaAtualizada;
  }

  async softDelete(idIndustria: string) {
    const [resultado] = await this.db.db
      .update(industria)
      .set({ deletedAt: sql`now()` })
      .where(and(eq(industria.idIndustria, idIndustria), isNull(industria.deletedAt)))
      .returning();

    return resultado;
  }

  async restaurar(idIndustria: string) {
    const [resultado] = await this.db.db.update(industria).set({ deletedAt: null }).where(eq(industria.idIndustria, idIndustria)).returning();

    return resultado;
  }

  async listarComDeletados() {
    return await this.db.db.select().from(industria).orderBy(desc(industria.createdAt));
  }
}
