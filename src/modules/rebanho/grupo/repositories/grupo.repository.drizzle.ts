import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import { grupo, propriedade } from '../../../../database/schema';
import { CreateGrupoDto } from '../dto/create-grupo.dto';
import { UpdateGrupoDto } from '../dto/update-grupo.dto';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class GrupoRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  async create(createGrupoDto: CreateGrupoDto) {
    try {
      const [novoGrupo] = await this.databaseService.db
        .insert(grupo)
        .values({
          nomeGrupo: createGrupoDto.nome_grupo,
          idPropriedade: createGrupoDto.id_propriedade,
          color: createGrupoDto.color,
        })
        .returning();
      return novoGrupo;
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'create' });
      throw new InternalServerErrorException(`Erro ao criar grupo: ${error.message}`);
    }
  }

  async findAll() {
    try {
      return await this.databaseService.db.query.grupo.findMany({
        where: isNull(grupo.deletedAt),
        orderBy: [asc(grupo.nomeGrupo)],
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'findAll' });
      throw new InternalServerErrorException(`Erro ao buscar grupos: ${error.message}`);
    }
  }

  async findByPropriedade(idPropriedade: string, page: number, limit: number) {
    try {
      const offset = (page - 1) * limit;

      const [registros, [{ count }]] = await Promise.all([
        this.databaseService.db.query.grupo.findMany({
          where: and(eq(grupo.idPropriedade, idPropriedade), isNull(grupo.deletedAt)),
          orderBy: [asc(grupo.nomeGrupo)],
          limit,
          offset,
          with: {
            propriedade: {
              columns: {
                nome: true,
              },
            },
          },
        }),
        this.databaseService.db
          .select({ count: sql<number>`count(*)::int` })
          .from(grupo)
          .where(and(eq(grupo.idPropriedade, idPropriedade), isNull(grupo.deletedAt))),
      ]);

      return { registros, total: count };
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'findByPropriedade' });
      throw new InternalServerErrorException(`Erro ao buscar grupos da propriedade: ${error.message}`);
    }
  }

  async findById(id: string) {
    try {
      return await this.databaseService.db.query.grupo.findFirst({
        where: and(eq(grupo.idGrupo, id), isNull(grupo.deletedAt)),
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'findById' });
      throw new InternalServerErrorException(`Erro ao buscar grupo: ${error.message}`);
    }
  }

  async update(id: string, updateGrupoDto: UpdateGrupoDto) {
    try {
      const data: any = { updatedAt: new Date().toISOString() };
      if (updateGrupoDto.nome_grupo) data.nomeGrupo = updateGrupoDto.nome_grupo;
      if (updateGrupoDto.color) data.color = updateGrupoDto.color;
      if (updateGrupoDto.id_propriedade) data.idPropriedade = updateGrupoDto.id_propriedade;

      const [grupoAtualizado] = await this.databaseService.db.update(grupo).set(data).where(eq(grupo.idGrupo, id)).returning();

      return grupoAtualizado;
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'update' });
      throw new InternalServerErrorException(`Erro ao atualizar grupo: ${error.message}`);
    }
  }

  async softDelete(id: string) {
    try {
      const [grupoDeletado] = await this.databaseService.db
        .update(grupo)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(grupo.idGrupo, id))
        .returning();
      return grupoDeletado;
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'softDelete' });
      throw new InternalServerErrorException(`Erro ao deletar grupo: ${error.message}`);
    }
  }

  async restore(id: string) {
    try {
      const [grupoRestaurado] = await this.databaseService.db.update(grupo).set({ deletedAt: null }).where(eq(grupo.idGrupo, id)).returning();
      return grupoRestaurado;
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'restore' });
      throw new InternalServerErrorException(`Erro ao restaurar grupo: ${error.message}`);
    }
  }

  async findAllWithDeleted() {
    try {
      return await this.databaseService.db.query.grupo.findMany({
        orderBy: [desc(grupo.deletedAt), asc(grupo.nomeGrupo)],
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'findAllWithDeleted' });
      throw new InternalServerErrorException(`Erro ao buscar grupos com deletados: ${error.message}`);
    }
  }

  async findByIdWithDeleted(id: string) {
    try {
      return await this.databaseService.db.query.grupo.findFirst({
        where: eq(grupo.idGrupo, id),
      });
    } catch (error) {
      this.logger.logError(error, { repository: 'GrupoRepositoryDrizzle', method: 'findByIdWithDeleted' });
      throw new InternalServerErrorException(`Erro ao buscar grupo (incluindo deletados): ${error.message}`);
    }
  }
}
