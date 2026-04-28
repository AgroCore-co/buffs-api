import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull, desc, sql, count } from 'drizzle-orm';
import { dadoszootecnicos, bufalo, propriedade } from 'src/database/schema';
import { CreateDadoZootecnicoDto } from '../dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from '../dto/update-dado-zootecnico.dto';

@Injectable()
export class DadosZootecnicosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async createFromDto(dto: CreateDadoZootecnicoDto, idBufalo: string, idUsuario: string) {
    try {
      const [result] = await this.databaseService.db
        .insert(dadoszootecnicos)
        .values({
          idBufalo: idBufalo,
          idUsuario: idUsuario,
          peso: dto.peso ? String(dto.peso) : null,
          condicaoCorporal: dto.condicaoCorporal ? String(dto.condicaoCorporal) : null,
          corPelagem: dto.corPelagem,
          formatoChifre: dto.formatoChifre,
          porteCorporal: dto.porteCorporal,
          dtRegistro: dto.dtRegistro ? dto.dtRegistro.toISOString() : new Date().toISOString(),
          tipoPesagem: dto.tipoPesagem,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[DadosZootecnicosRepository] Erro ao criar: ${error.message}`);
    }
  }

  async updateFromDto(idZootec: string, dto: UpdateDadoZootecnicoDto) {
    const updateData: Record<string, any> = {};

    if (dto.peso !== undefined) updateData.peso = String(dto.peso);
    if (dto.condicaoCorporal !== undefined) updateData.condicaoCorporal = String(dto.condicaoCorporal);
    if (dto.corPelagem !== undefined) updateData.corPelagem = dto.corPelagem;
    if (dto.formatoChifre !== undefined) updateData.formatoChifre = dto.formatoChifre;
    if (dto.porteCorporal !== undefined) updateData.porteCorporal = dto.porteCorporal;
    if (dto.dtRegistro !== undefined) updateData.dtRegistro = dto.dtRegistro.toISOString();
    if (dto.tipoPesagem !== undefined) updateData.tipoPesagem = dto.tipoPesagem;

    const [result] = await this.databaseService.db
      .update(dadoszootecnicos)
      .set(updateData)
      .where(eq(dadoszootecnicos.idZootec, idZootec))
      .returning();
    return result || null;
  }

  async findAllByBufalo(idBufalo: string, limit: number, offset: number) {
    const [data, totalResult] = await Promise.all([
      this.databaseService.db.query.dadoszootecnicos.findMany({
        where: and(eq(dadoszootecnicos.idBufalo, idBufalo), isNull(dadoszootecnicos.deletedAt)),
        limit,
        offset,
        orderBy: [desc(dadoszootecnicos.dtRegistro)],
      }),
      this.databaseService.db
        .select({ count: count() })
        .from(dadoszootecnicos)
        .where(and(eq(dadoszootecnicos.idBufalo, idBufalo), isNull(dadoszootecnicos.deletedAt))),
    ]);

    return {
      data,
      total: totalResult[0].count,
    };
  }

  async findAllByPropriedade(idPropriedade: string, limit: number, offset: number) {
    const [data, totalResult] = await Promise.all([
      this.databaseService.db
        .select({
          idZootec: dadoszootecnicos.idZootec,
          idBufalo: dadoszootecnicos.idBufalo,
          idUsuario: dadoszootecnicos.idUsuario,
          peso: dadoszootecnicos.peso,
          condicaoCorporal: dadoszootecnicos.condicaoCorporal,
          corPelagem: dadoszootecnicos.corPelagem,
          formatoChifre: dadoszootecnicos.formatoChifre,
          porteCorporal: dadoszootecnicos.porteCorporal,
          dtRegistro: dadoszootecnicos.dtRegistro,
          tipoPesagem: dadoszootecnicos.tipoPesagem,
          createdAt: dadoszootecnicos.createdAt,
          updatedAt: dadoszootecnicos.updatedAt,
          bufalo: {
            brinco: bufalo.brinco,
            nome: bufalo.nome,
          },
        })
        .from(dadoszootecnicos)
        .leftJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(and(eq(bufalo.idPropriedade, idPropriedade), isNull(dadoszootecnicos.deletedAt), isNull(bufalo.deletedAt)))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(dadoszootecnicos.dtRegistro)),
      this.databaseService.db
        .select({ count: count() })
        .from(dadoszootecnicos)
        .leftJoin(bufalo, eq(dadoszootecnicos.idBufalo, bufalo.idBufalo))
        .where(and(eq(bufalo.idPropriedade, idPropriedade), isNull(dadoszootecnicos.deletedAt), isNull(bufalo.deletedAt))),
    ]);

    return {
      data,
      total: totalResult[0].count,
    };
  }

  async findById(idZootec: string) {
    const result = await this.databaseService.db.query.dadoszootecnicos.findFirst({
      where: and(eq(dadoszootecnicos.idZootec, idZootec), isNull(dadoszootecnicos.deletedAt)),
      with: {
        bufalo: {
          columns: {
            brinco: true,
            nome: true,
          },
        },
      },
    });

    return result || null;
  }

  async findByIdIncludingDeleted(idZootec: string) {
    const result = await this.databaseService.db.query.dadoszootecnicos.findFirst({
      where: eq(dadoszootecnicos.idZootec, idZootec),
      with: {
        bufalo: {
          columns: {
            brinco: true,
            nome: true,
          },
        },
      },
    });

    return result || null;
  }

  async softDelete(id: string) {
    const [result] = await this.databaseService.db
      .update(dadoszootecnicos)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(dadoszootecnicos.idZootec, id))
      .returning();
    return result || null;
  }

  async restore(id: string) {
    const [result] = await this.databaseService.db
      .update(dadoszootecnicos)
      .set({ deletedAt: null })
      .where(eq(dadoszootecnicos.idZootec, id))
      .returning();
    return result || null;
  }

  async findAllWithDeleted() {
    return await this.databaseService.db.query.dadoszootecnicos.findMany({
      orderBy: [desc(dadoszootecnicos.dtRegistro)],
    });
  }
}
