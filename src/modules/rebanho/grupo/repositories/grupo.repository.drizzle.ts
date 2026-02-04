import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { BaseRepository } from '../../../../core/database/base.repository';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import { grupo } from '../../../../database/schema';
import { CreateGrupoDto } from '../dto/create-grupo.dto';
import { UpdateGrupoDto } from '../dto/update-grupo.dto';

@Injectable()
export class GrupoRepositoryDrizzle extends BaseRepository<typeof grupo> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, grupo, 'idGrupo', 'GrupoRepositoryDrizzle');
  }

  private createFromDto(dto: CreateGrupoDto) {
    return {
      nomeGrupo: dto.nomeGrupo,
      idPropriedade: dto.idPropriedade,
      color: dto.color,
    };
  }

  private updateFromDto(dto: UpdateGrupoDto) {
    const data: any = {};
    if (dto.nomeGrupo) data.nomeGrupo = dto.nomeGrupo;
    if (dto.color) data.color = dto.color;
    if (dto.idPropriedade) data.idPropriedade = dto.idPropriedade;
    return data;
  }

  override async findAll() {
    return await this.databaseService.db.query.grupo.findMany({
      where: isNull(grupo.deletedAt),
      orderBy: [asc(grupo.nomeGrupo)],
    });
  }

  async findByPropriedade(idPropriedade: string, page: number, limit: number) {
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
  }

  async findByIdWithDeleted(id: string) {
    return await this.databaseService.db.query.grupo.findFirst({
      where: eq(grupo.idGrupo, id),
    });
  }

  override async findAllWithDeleted() {
    return await this.databaseService.db.query.grupo.findMany({
      orderBy: [desc(grupo.deletedAt), asc(grupo.nomeGrupo)],
    });
  }
}
