import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { medicacoes } from 'src/database/schema';
import { CreateMedicacaoDto } from '../dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from '../dto/update-medicacao.dto';

@Injectable()
export class MedicamentosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateMedicacaoDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(medicacoes)
        .values({
          idPropriedade: dto.id_propriedade,
          tipoTratamento: dto.tipo_tratamento,
          medicacao: dto.medicacao,
          descricao: dto.descricao,
        })
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar medicação: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const result = await this.databaseService.db.query.medicacoes.findMany({
        where: isNull(medicacoes.deletedAt),
        orderBy: [desc(medicacoes.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar medicações: ${error.message}`);
    }
  }

  async findByPropriedade(idPropriedade: string) {
    try {
      const result = await this.databaseService.db.query.medicacoes.findMany({
        where: and(eq(medicacoes.idPropriedade, idPropriedade), isNull(medicacoes.deletedAt)),
        orderBy: [desc(medicacoes.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar medicações da propriedade: ${error.message}`);
    }
  }

  async findById(idMedicacao: string) {
    try {
      const result = await this.databaseService.db.query.medicacoes.findFirst({
        where: and(eq(medicacoes.idMedicacao, idMedicacao), isNull(medicacoes.deletedAt)),
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar medicação: ${error.message}`);
    }
  }

  async update(idMedicacao: string, dto: UpdateMedicacaoDto) {
    try {
      const updateData: Record<string, any> = {
        updatedAt: sql`now()`,
      };

      if (dto.id_propriedade !== undefined) updateData.idPropriedade = dto.id_propriedade;
      if (dto.tipo_tratamento !== undefined) updateData.tipoTratamento = dto.tipo_tratamento;
      if (dto.medicacao !== undefined) updateData.medicacao = dto.medicacao;
      if (dto.descricao !== undefined) updateData.descricao = dto.descricao;

      const [result] = await this.databaseService.db
        .update(medicacoes)
        .set(updateData)
        .where(and(eq(medicacoes.idMedicacao, idMedicacao), isNull(medicacoes.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar medicação: ${error.message}`);
    }
  }

  async softDelete(idMedicacao: string) {
    try {
      const [result] = await this.databaseService.db
        .update(medicacoes)
        .set({ deletedAt: sql`now()` })
        .where(and(eq(medicacoes.idMedicacao, idMedicacao), isNull(medicacoes.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao deletar medicação: ${error.message}`);
    }
  }

  async restore(idMedicacao: string) {
    try {
      const [result] = await this.databaseService.db
        .update(medicacoes)
        .set({ deletedAt: null })
        .where(eq(medicacoes.idMedicacao, idMedicacao))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar medicação: ${error.message}`);
    }
  }

  async findAllWithDeleted() {
    try {
      const result = await this.databaseService.db.query.medicacoes.findMany({
        orderBy: [desc(medicacoes.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar medicações com deletadas: ${error.message}`);
    }
  }
}
