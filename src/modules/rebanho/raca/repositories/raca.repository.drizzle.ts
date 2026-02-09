import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { asc, eq } from 'drizzle-orm';
import { raca } from '../../../../database/schema';
import { CreateRacaDto } from '../dto/create-raca.dto';
import { UpdateRacaDto } from '../dto/update-raca.dto';

/**
 * Repository para operações de Raça usando Drizzle ORM.
 */
@Injectable()
export class RacaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Busca todas as raças ordenadas por nome
   */
  async findAll() {
    return await this.databaseService.db.query.raca.findMany({
      where: (table, { isNull }) => isNull(table.deletedAt),
      orderBy: [asc(raca.nome)],
    });
  }

  /**
   * Busca raça por ID (apenas registros ativos)
   */
  async findById(id: string) {
    return (
      (await this.databaseService.db.query.raca.findFirst({
        where: (table, { eq, and, isNull }) => and(eq(table.idRaca, id), isNull(table.deletedAt)),
      })) || null
    );
  }

  /**
   * Busca raça por ID incluindo soft-deleted (para restore)
   */
  async findByIdWithDeleted(id: string) {
    const [result] = await this.databaseService.db.select().from(raca).where(eq(raca.idRaca, id)).limit(1);
    return result || null;
  }

  /**
   * Cria raça a partir do DTO
   */
  async createFromDto(createRacaDto: CreateRacaDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(raca)
        .values({
          nome: createRacaDto.nome,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[RacaRepository] Erro ao criar raça: ${error.message}`);
    }
  }

  /**
   * Atualiza raça a partir do DTO
   */
  async updateFromDto(id: string, updateRacaDto: UpdateRacaDto) {
    const data: any = { updatedAt: new Date().toISOString() };
    if (updateRacaDto.nome) data.nome = updateRacaDto.nome;

    const [result] = await this.databaseService.db.update(raca).set(data).where(eq(raca.idRaca, id)).returning();
    return result || null;
  }

  /**
   * Soft delete de raça
   */
  async softDelete(id: string) {
    const [result] = await this.databaseService.db.update(raca).set({ deletedAt: new Date().toISOString() }).where(eq(raca.idRaca, id)).returning();
    return result || null;
  }

  async restore(id: string) {
    const [result] = await this.databaseService.db.update(raca).set({ deletedAt: null }).where(eq(raca.idRaca, id)).returning();
    return result || null;
  }

  async findAllWithDeleted() {
    return await this.databaseService.db.query.raca.findMany({
      orderBy: [asc(raca.nome)],
    });
  }

  async create(data: any) {
    return this.createFromDto(data);
  }

  async update(id: string, data: any) {
    return this.updateFromDto(id, data);
  }
}
