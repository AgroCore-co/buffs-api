import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { BaseRepository } from 'src/core/database/base.repository';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { lote, grupo } from 'src/database/schema';
import { CreateLoteDto } from '../dto/create-lote.dto';
import { UpdateLoteDto } from '../dto/update-lote.dto';

/**
 * Repository Drizzle para operações de Lote.
 * Isola queries do Drizzle da lógica de negócio.
 *
 * IMPORTANTE: O campo geo_mapa é do tipo JSONB no banco.
 * Drizzle retorna como objeto JavaScript automaticamente, pronto para o frontend usar com mapas.
 */
@Injectable()
export class LoteRepositoryDrizzle extends BaseRepository<typeof lote> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, lote, 'idLote', 'LoteRepositoryDrizzle');
  }

  /**
   * Cria um novo lote
   * geo_mapa é inserido como string (GeoJSON stringificado ou WKT)
   */
  async criar(createLoteDto: CreateLoteDto) {
    return this.create({
      nomeLote: createLoteDto.nomeLote,
      idPropriedade: createLoteDto.idPropriedade,
      idGrupo: createLoteDto.idGrupo,
      tipoLote: createLoteDto.tipoLote,
      status: createLoteDto.status,
      descricao: createLoteDto.descricao,
      qtdMax: createLoteDto.qtd_max,
      areaM2: createLoteDto.area_m2 !== undefined ? String(createLoteDto.area_m2) : undefined,
      geoMapa: createLoteDto.geo_mapa,
    });
  }

  /**
   * Busca todos os lotes de uma propriedade com join no grupo
   * geo_mapa retorna como objeto (JSONB é automaticamente parseado pelo Drizzle)
   */
  async buscarPorPropriedade(idPropriedade: string) {
    return await this.databaseService.db.query.lote.findMany({
      where: and(eq(lote.idPropriedade, idPropriedade), isNull(lote.deletedAt)),
      with: {
        grupo: {
          columns: {
            idGrupo: true,
            nomeGrupo: true,
            color: true,
          },
        },
      },
      orderBy: [desc(lote.createdAt)],
    });
  }

  /**
   * Busca um lote por ID com join no grupo e propriedade
   * geo_mapa retorna como objeto pronto para uso no frontend
   */
  async buscarPorId(id: string) {
    return await this.databaseService.db.query.lote.findFirst({
      where: and(eq(lote.idLote, id), isNull(lote.deletedAt)),
      with: {
        grupo: {
          columns: {
            idGrupo: true,
            nomeGrupo: true,
            color: true,
          },
        },
        propriedade: {
          columns: {
            idDono: true,
          },
        },
      },
    });
  }

  /**
   * Atualiza um lote
   * geo_mapa é atualizado como string (geometry/PostGIS)
   */
  async atualizar(id: string, updateLoteDto: UpdateLoteDto) {
    const data: any = {};

    if (updateLoteDto.nomeLote !== undefined) data.nomeLote = updateLoteDto.nomeLote;
    if (updateLoteDto.idPropriedade !== undefined) data.idPropriedade = updateLoteDto.idPropriedade;
    if (updateLoteDto.idGrupo !== undefined) data.idGrupo = updateLoteDto.idGrupo;
    if (updateLoteDto.tipoLote !== undefined) data.tipoLote = updateLoteDto.tipoLote;
    if (updateLoteDto.status !== undefined) data.status = updateLoteDto.status;
    if (updateLoteDto.descricao !== undefined) data.descricao = updateLoteDto.descricao;
    if (updateLoteDto.qtd_max !== undefined) data.qtdMax = updateLoteDto.qtd_max;
    if (updateLoteDto.area_m2 !== undefined) data.areaM2 = String(updateLoteDto.area_m2);
    if (updateLoteDto.geo_mapa !== undefined) data.geoMapa = updateLoteDto.geo_mapa;

    return this.update(id, data);
  }

  /**
   * Remove um lote (hard delete)
   */
  async remover(id: string) {
    return this.hardDelete(id);
  }

  /**
   * Busca um grupo por ID para validação
   */
  async buscarGrupoPorId(idGrupo: string) {
    return await this.databaseService.db.query.grupo.findFirst({
      where: and(eq(grupo.idGrupo, idGrupo), isNull(grupo.deletedAt)),
      columns: {
        idGrupo: true,
        idPropriedade: true,
      },
    });
  }
}
