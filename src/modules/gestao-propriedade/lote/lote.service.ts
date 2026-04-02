import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { LoteRepositoryDrizzle } from './repositories';
import { GrupoRepositoryDrizzle } from '../../rebanho/grupo/repositories/grupo.repository.drizzle';

@Injectable()
export class LoteService {
  constructor(
    private readonly loteRepo: LoteRepositoryDrizzle,
    private readonly grupoRepository: GrupoRepositoryDrizzle,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Parse do campo geo_mapa (geometry/PostGIS)
   * Converte string GeoJSON para objeto JavaScript para o frontend usar com mapas
   */
  private parseGeoMapa(lote: any): any {
    if (lote?.geoMapa && typeof lote.geoMapa === 'string') {
      try {
        lote.geoMapa = JSON.parse(lote.geoMapa);
      } catch (error) {
        // Se não for JSON válido, mantém como string (pode ser WKT)
        this.logger.warn(`Formato geo_mapa não é JSON válido para lote ${lote.idLote}`);
      }
    }
    return lote;
  }

  /**
   * Valida se o grupo existe e pertence à mesma propriedade do lote
   */
  private async validateGrupoOwnership(grupoId: string, propriedadeId: string) {
    if (!grupoId) return; // Se não há grupo, não precisa validar

    const grupo = await this.grupoRepository.findById(grupoId);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${grupoId} não encontrado.`);
    }

    if (grupo.idPropriedade !== propriedadeId) {
      throw new BadRequestException(`O grupo selecionado não pertence à mesma propriedade do lote.`);
    }
  }

  async create(createLoteDto: CreateLoteDto, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(userId, createLoteDto.idPropriedade);

    // Valida se o grupo pertence à mesma propriedade (se informado)
    if (createLoteDto.idGrupo) {
      await this.validateGrupoOwnership(createLoteDto.idGrupo, createLoteDto.idPropriedade);
    }

    // geo_mapa é string (GeoJSON stringificado), será convertido para objeto no parseGeoMapa
    const novoLote = await this.loteRepo.criar(createLoteDto);

    // Parseia o retorno para o cliente (converte string para objeto)
    return formatDateFields(this.parseGeoMapa(novoLote));
  }

  async findAllByPropriedade(id_propriedade: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);

    const lotes = await this.loteRepo.buscarPorPropriedade(id_propriedade);

    // Parseia cada lote da lista (geo_mapa já vem como objeto do Drizzle)
    return formatDateFieldsArray(lotes.map((loteItem) => this.parseGeoMapa(loteItem)));
  }

  async findOne(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    const lote = await this.loteRepo.buscarPorId(id);

    if (!lote) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado.`);
    }

    if (!lote.idPropriedade) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    await this.authHelper.validatePropriedadeAccess(userId, lote.idPropriedade);

    const { propriedade: _, ...lotePublico } = lote as Record<string, any>;
    return formatDateFields(this.parseGeoMapa(lotePublico));
  }

  async update(id: string, updateLoteDto: UpdateLoteDto, user: any) {
    const loteExistente = await this.findOne(id, user); // Valida a posse do lote que será atualizado

    // Determina a propriedade a ser validada (nova ou existente)
    const propriedadeParaValidar = updateLoteDto.idPropriedade || loteExistente.idPropriedade;

    // Se a propriedade estiver sendo alterada, valida a posse da nova propriedade
    if (updateLoteDto.idPropriedade) {
      const userId = await this.authHelper.getUserId(user);
      await this.authHelper.validatePropriedadeAccess(userId, updateLoteDto.idPropriedade);
    }

    // Valida se o grupo pertence à mesma propriedade (se informado)
    if (updateLoteDto.idGrupo !== undefined) {
      await this.validateGrupoOwnership(updateLoteDto.idGrupo, propriedadeParaValidar);
    }

    // geo_mapa é atualizado como string (geometry/PostGIS), será convertido para objeto no parseGeoMapa
    const loteAtualizado = await this.loteRepo.atualizar(id, updateLoteDto);

    return formatDateFields(this.parseGeoMapa(loteAtualizado));
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user); // Valida posse

    await this.loteRepo.remover(id);
    return;
  }
}
