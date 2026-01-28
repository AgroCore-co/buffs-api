import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull, desc, sql, count } from 'drizzle-orm';
import { dadoszootecnicos, bufalo, propriedade } from 'src/database/schema';
import { CreateDadoZootecnicoDto } from '../dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from '../dto/update-dado-zootecnico.dto';

@Injectable()
export class DadosZootecnicosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateDadoZootecnicoDto, idBufalo: string, idUsuario: string) {
    try {
      const [result] = await this.databaseService.db
        .insert(dadoszootecnicos)
        .values({
          idBufalo: idBufalo,
          idUsuario: idUsuario,
          peso: dto.peso ? String(dto.peso) : null,
          condicaoCorporal: dto.condicao_corporal ? String(dto.condicao_corporal) : null,
          corPelagem: dto.cor_pelagem,
          formatoChifre: dto.formato_chifre,
          porteCorporal: dto.porte_corporal,
          dtRegistro: dto.dt_registro ? dto.dt_registro.toISOString() : new Date().toISOString(),
          tipoPesagem: dto.tipo_pesagem,
        })
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar dado zootécnico: ${error.message}`);
    }
  }

  async findAllByBufalo(idBufalo: string, limit: number, offset: number) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados zootécnicos do búfalo: ${error.message}`);
    }
  }

  async findAllByPropriedade(idPropriedade: string, limit: number, offset: number) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados zootécnicos da propriedade: ${error.message}`);
    }
  }

  async findById(idZootec: string) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dado zootécnico: ${error.message}`);
    }
  }

  async update(idZootec: string, dto: UpdateDadoZootecnicoDto) {
    try {
      const updateData: Record<string, any> = {
        updatedAt: sql`now()`,
      };

      if (dto.peso !== undefined) updateData.peso = String(dto.peso);
      if (dto.condicao_corporal !== undefined) updateData.condicaoCorporal = String(dto.condicao_corporal);
      if (dto.cor_pelagem !== undefined) updateData.corPelagem = dto.cor_pelagem;
      if (dto.formato_chifre !== undefined) updateData.formatoChifre = dto.formato_chifre;
      if (dto.porte_corporal !== undefined) updateData.porteCorporal = dto.porte_corporal;
      if (dto.dt_registro !== undefined) updateData.dtRegistro = dto.dt_registro.toISOString();
      if (dto.tipo_pesagem !== undefined) updateData.tipoPesagem = dto.tipo_pesagem;

      const [result] = await this.databaseService.db
        .update(dadoszootecnicos)
        .set(updateData)
        .where(and(eq(dadoszootecnicos.idZootec, idZootec), isNull(dadoszootecnicos.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar dado zootécnico: ${error.message}`);
    }
  }

  async softDelete(idZootec: string) {
    try {
      const [result] = await this.databaseService.db
        .update(dadoszootecnicos)
        .set({ deletedAt: sql`now()` })
        .where(and(eq(dadoszootecnicos.idZootec, idZootec), isNull(dadoszootecnicos.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao deletar dado zootécnico: ${error.message}`);
    }
  }

  async restore(idZootec: string) {
    try {
      const [result] = await this.databaseService.db
        .update(dadoszootecnicos)
        .set({ deletedAt: null })
        .where(eq(dadoszootecnicos.idZootec, idZootec))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar dado zootécnico: ${error.message}`);
    }
  }

  async findAllWithDeleted() {
    try {
      const result = await this.databaseService.db.query.dadoszootecnicos.findMany({
        orderBy: [desc(dadoszootecnicos.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados zootécnicos com deletados: ${error.message}`);
    }
  }
}
