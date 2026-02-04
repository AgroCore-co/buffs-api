import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { BaseRepository } from '../../../../core/database/base.repository';
import { asc } from 'drizzle-orm';
import { raca } from '../../../../database/schema';
import { CreateRacaDto } from '../dto/create-raca.dto';
import { UpdateRacaDto } from '../dto/update-raca.dto';

/**
 * Repository para operações de Raça usando Drizzle ORM.
 * Herda métodos CRUD básicos do BaseRepository.
 */
@Injectable()
export class RacaRepositoryDrizzle extends BaseRepository<typeof raca> {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService, raca, 'idRaca', 'RacaRepositoryDrizzle');
  }

  /**
   * Busca todas as raças ordenadas por nome (sobrescreve método base para adicionar ordenação)
   */
  async findAll() {
    return await this.databaseService.db.query.raca.findMany({
      where: (table, { isNull }) => isNull(table.deletedAt),
      orderBy: [asc(raca.nome)],
    });
  }

  /**
   * Método auxiliar para criar raça a partir do DTO
   */
  async createFromDto(createRacaDto: CreateRacaDto) {
    return this.create({
      nome: createRacaDto.nome,
    });
  }

  /**
   * Método auxiliar para atualizar raça a partir do DTO
   */
  async updateFromDto(id: string, updateRacaDto: UpdateRacaDto) {
    const data: any = { updatedAt: new Date().toISOString() };
    if (updateRacaDto.nome) data.nome = updateRacaDto.nome;
    return this.update(id, data);
  }
}
