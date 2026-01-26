import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { raca } from '../../../../database/schema';
import { CreateRacaDto } from '../dto/create-raca.dto';
import { UpdateRacaDto } from '../dto/update-raca.dto';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class RacaRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  async create(createRacaDto: CreateRacaDto) {
    try {
      const [novaRaca] = await this.databaseService.db
        .insert(raca)
        .values({
          nome: createRacaDto.nome,
        })
        .returning();
      return novaRaca;
    } catch (error) {
      this.logger.logError(error, { repository: 'RacaRepositoryDrizzle', method: 'create' });
      throw new InternalServerErrorException(`Erro ao criar raça: ${error.message}`);
    }
  }

  async findAll() {
    try {
      return await this.databaseService.db.query.raca.findMany({
        where: isNull(raca.deletedAt),
        orderBy: [asc(raca.nome)],
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'RacaRepositoryDrizzle', method: 'findAll' });
      throw new InternalServerErrorException(`Erro ao buscar raças: ${error.message}`);
    }
  }

  async findById(id: string) {
    try {
      return await this.databaseService.db.query.raca.findFirst({
        where: and(eq(raca.idRaca, id), isNull(raca.deletedAt)),
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'RacaRepositoryDrizzle', method: 'findById' });
      throw new InternalServerErrorException(`Erro ao buscar raça: ${error.message}`);
    }
  }

  async update(id: string, updateRacaDto: UpdateRacaDto) {
    try {
      const data: any = { updatedAt: new Date().toISOString() };
      if (updateRacaDto.nome) data.nome = updateRacaDto.nome;

      const [racaAtualizada] = await this.databaseService.db.update(raca).set(data).where(eq(raca.idRaca, id)).returning();

      return racaAtualizada;
    } catch (error) {
      this.logger.logError(error, { repository: 'RacaRepositoryDrizzle', method: 'update' });
      throw new InternalServerErrorException(`Erro ao atualizar raça: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const [racaDeletada] = await this.databaseService.db
        .update(raca)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(raca.idRaca, id))
        .returning();
      return racaDeletada;
    } catch (error) {
      this.logger.logError(error, { repository: 'RacaRepositoryDrizzle', method: 'remove' });
      throw new InternalServerErrorException(`Erro ao deletar raça: ${error.message}`);
    }
  }

  async softDelete(id: string) {
    return this.remove(id);
  }
}
