import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { BaseRepository } from 'src/core/database/base.repository';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { medicacoes } from 'src/database/schema';
import { CreateMedicacaoDto } from '../dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from '../dto/update-medicacao.dto';

/**
 * Repository para operações de Medicamentos usando Drizzle ORM.
 * Herda métodos CRUD básicos do BaseRepository.
 */
@Injectable()
export class MedicamentosRepositoryDrizzle extends BaseRepository<typeof medicacoes> {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService, medicacoes, 'idMedicacao', 'MedicamentosRepositoryDrizzle');
  }

  /**
   * Busca todas as medicações ordenadas por data de criação (sobrescreve para adicionar ordenação)
   */
  async findAll() {
    return await this.databaseService.db.query.medicacoes.findMany({
      where: (table, { isNull }) => isNull(table.deletedAt),
      orderBy: [desc(medicacoes.createdAt)],
    });
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
    return this.create({
      idPropriedade: dto.idPropriedade,
      tipoTratamento: dto.tipoTratamento,
      medicacao: dto.medicacao,
      descricao: dto.descricao,
    });
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

    return this.update(idMedicacao, updateData);
  }
}
