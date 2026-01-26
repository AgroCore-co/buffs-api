import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, or, desc, isNull } from 'drizzle-orm';
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
export class LoteRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Cria um novo lote
   * geo_mapa é inserido como string (GeoJSON stringificado ou WKT)
   */
  async criar(createLoteDto: CreateLoteDto) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const data = {
        nomeLote: createLoteDto.nome_lote,
        idPropriedade: createLoteDto.id_propriedade,
        idGrupo: createLoteDto.id_grupo,
        tipoLote: createLoteDto.tipo_lote,
        status: createLoteDto.status,
        descricao: createLoteDto.descricao,
        qtdMax: createLoteDto.qtd_max,
        areaM2: createLoteDto.area_m2 !== undefined ? String(createLoteDto.area_m2) : undefined,
        geoMapa: createLoteDto.geo_mapa,
      };

      const [novoLote] = await this.databaseService.db.insert(lote).values(data).returning();

      return novoLote;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'criar',
        dto: createLoteDto,
      });
      throw new InternalServerErrorException(`Erro ao criar lote: ${error.message}`);
    }
  }

  /**
   * Busca todos os lotes de uma propriedade com join no grupo
   * geo_mapa retorna como objeto (JSONB é automaticamente parseado pelo Drizzle)
   */
  async buscarPorPropriedade(idPropriedade: string) {
    try {
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
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'buscarPorPropriedade',
        idPropriedade,
      });
      throw new InternalServerErrorException(`Erro ao buscar lotes: ${error.message}`);
    }
  }

  /**
   * Busca um lote por ID com join no grupo e propriedade
   * geo_mapa retorna como objeto pronto para uso no frontend
   */
  async buscarPorId(id: string) {
    try {
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
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'buscarPorId',
        id,
      });
      throw new InternalServerErrorException(`Erro ao buscar lote: ${error.message}`);
    }
  }

  /**
   * Atualiza um lote
   * geo_mapa é atualizado como string (geometry/PostGIS)
   */
  async atualizar(id: string, updateLoteDto: UpdateLoteDto) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const data: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updateLoteDto.nome_lote !== undefined) data.nomeLote = updateLoteDto.nome_lote;
      if (updateLoteDto.id_propriedade !== undefined) data.idPropriedade = updateLoteDto.id_propriedade;
      if (updateLoteDto.id_grupo !== undefined) data.idGrupo = updateLoteDto.id_grupo;
      if (updateLoteDto.tipo_lote !== undefined) data.tipoLote = updateLoteDto.tipo_lote;
      if (updateLoteDto.status !== undefined) data.status = updateLoteDto.status;
      if (updateLoteDto.descricao !== undefined) data.descricao = updateLoteDto.descricao;
      if (updateLoteDto.qtd_max !== undefined) data.qtdMax = updateLoteDto.qtd_max;
      if (updateLoteDto.area_m2 !== undefined) data.areaM2 = String(updateLoteDto.area_m2);
      if (updateLoteDto.geo_mapa !== undefined) data.geoMapa = updateLoteDto.geo_mapa;

      const [loteAtualizado] = await this.databaseService.db.update(lote).set(data).where(eq(lote.idLote, id)).returning();

      return loteAtualizado;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'atualizar',
        id,
        dto: updateLoteDto,
      });
      throw new InternalServerErrorException(`Erro ao atualizar lote: ${error.message}`);
    }
  }

  /**
   * Remove um lote
   */
  async remover(id: string) {
    try {
      await this.databaseService.db.delete(lote).where(eq(lote.idLote, id));
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'remover',
        id,
      });
      throw new InternalServerErrorException(`Erro ao remover lote: ${error.message}`);
    }
  }

  /**
   * Busca um grupo por ID para validação
   */
  async buscarGrupoPorId(idGrupo: string) {
    try {
      return await this.databaseService.db.query.grupo.findFirst({
        where: and(eq(grupo.idGrupo, idGrupo), isNull(grupo.deletedAt)),
        columns: {
          idGrupo: true,
          idPropriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'LoteRepositoryDrizzle',
        method: 'buscarGrupoPorId',
        idGrupo,
      });
      throw new InternalServerErrorException(`Erro ao buscar grupo: ${error.message}`);
    }
  }
}
