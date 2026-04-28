import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { medicacoes } from 'src/database/schema';
import { CreateMedicacaoDto } from '../dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from '../dto/update-medicacao.dto';

/**
 * Repository para operações de Medicamentos usando Drizzle ORM.
 */
@Injectable()
export class MedicamentosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Busca todas as medicações ordenadas por data de criação
   */
  async findAll() {
    return await this.databaseService.db.query.medicacoes.findMany({
      where: (table, { isNull }) => isNull(table.deletedAt),
      orderBy: [desc(medicacoes.createdAt)],
    });
  }

  async findById(id: string) {
    const [result] = await this.databaseService.db
      .select()
      .from(medicacoes)
      .where(and(eq(medicacoes.idMedicacao, id), isNull(medicacoes.deletedAt)))
      .limit(1);
    return result || null;
  }

  async findByIdIncludingDeleted(id: string) {
    const [result] = await this.databaseService.db.select().from(medicacoes).where(eq(medicacoes.idMedicacao, id)).limit(1);
    return result || null;
  }

  /**
   * Busca medicações de uma propriedade específica
   */
  async findByPropriedade(idPropriedade: string) {
    return await this.databaseService.db.query.medicacoes.findMany({
      where: and(eq(medicacoes.idPropriedade, idPropriedade), isNull(medicacoes.deletedAt)),
      orderBy: [desc(medicacoes.createdAt)],
    });
  }

  /**
   * Cria medicação a partir do DTO
   */
  async createFromDto(dto: CreateMedicacaoDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(medicacoes)
        .values({
          idPropriedade: dto.idPropriedade,
          tipoTratamento: dto.tipoTratamento,
          medicacao: dto.medicacao,
          descricao: dto.descricao,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[MedicamentosRepository] Erro ao criar: ${error.message}`);
    }
  }

  /**
   * Atualiza medicação a partir do DTO
   */
  async updateFromDto(idMedicacao: string, dto: UpdateMedicacaoDto) {
    const updateData: Record<string, any> = {
      updatedAt: sql`now()`,
    };

    if (dto.idPropriedade !== undefined) updateData.idPropriedade = dto.idPropriedade;
    if (dto.tipoTratamento !== undefined) updateData.tipoTratamento = dto.tipoTratamento;
    if (dto.medicacao !== undefined) updateData.medicacao = dto.medicacao;
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;

    const [result] = await this.databaseService.db.update(medicacoes).set(updateData).where(eq(medicacoes.idMedicacao, idMedicacao)).returning();
    return result || null;
  }

  async softDelete(id: string) {
    const [result] = await this.databaseService.db
      .update(medicacoes)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(medicacoes.idMedicacao, id))
      .returning();
    return result || null;
  }

  async restore(id: string) {
    const [result] = await this.databaseService.db.update(medicacoes).set({ deletedAt: null }).where(eq(medicacoes.idMedicacao, id)).returning();
    return result || null;
  }

  async findAllWithDeleted() {
    return await this.databaseService.db.query.medicacoes.findMany({
      orderBy: [desc(medicacoes.createdAt)],
    });
  }
}
