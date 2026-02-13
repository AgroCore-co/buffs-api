import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { LoteRepositoryDrizzle } from './repositories';
import { PropriedadeRepositoryDrizzle } from '../propriedade/repositories';

@Injectable()
export class LoteService {
  constructor(
    private readonly loteRepo: LoteRepositoryDrizzle,
    private readonly propriedadeRepo: PropriedadeRepositoryDrizzle,
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

  private async validateOwnership(propriedadeId: string, userId: string) {
    // Verifica se o usuário é dono da propriedade
    const propriedadeComoDono = await this.propriedadeRepo.buscarPropriedadeComoDono(propriedadeId, userId);

    if (propriedadeComoDono) {
      return; // É dono, pode prosseguir
    }

    // Se não é dono, verifica se é funcionário vinculado à propriedade
    const propriedadeComoFuncionario = await this.propriedadeRepo.buscarVinculoFuncionario(propriedadeId, userId);

    if (!propriedadeComoFuncionario) {
      throw new NotFoundException(`Propriedade com ID ${propriedadeId} não encontrada ou não pertence a este usuário.`);
    }
  }

  /**
   * Valida se o grupo existe e pertence à mesma propriedade do lote
   */
  private async validateGrupoOwnership(grupoId: string, propriedadeId: string) {
    if (!grupoId) return; // Se não há grupo, não precisa validar

    const grupo = await this.loteRepo.buscarGrupoPorId(grupoId);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${grupoId} não encontrado.`);
    }

    if (grupo.idPropriedade !== propriedadeId) {
      throw new BadRequestException(`O grupo selecionado não pertence à mesma propriedade do lote.`);
    }
  }

  async create(createLoteDto: CreateLoteDto, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.validateOwnership(createLoteDto.idPropriedade, userId);

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
    await this.validateOwnership(id_propriedade, userId);

    const lotes = await this.loteRepo.buscarPorPropriedade(id_propriedade);

    // Parseia cada lote da lista (geo_mapa já vem como objeto do Drizzle)
    return formatDateFieldsArray(lotes.map(this.parseGeoMapa));
  }

  async findOne(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    const lote = await this.loteRepo.buscarPorId(id);

    if (!lote) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado.`);
    }

    // Verifica se o usuário é dono da propriedade
    if (lote.propriedade && !Array.isArray(lote.propriedade) && lote.propriedade.idDono === userId) {
      delete (lote as any).propriedade;
      return formatDateFields(this.parseGeoMapa(lote));
    }

    // Se não é dono, verifica se é funcionário
    if (!lote.idPropriedade) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    const funcionarioData = await this.propriedadeRepo.buscarVinculoFuncionario(lote.idPropriedade, userId);

    if (!funcionarioData) {
      throw new NotFoundException(`Lote com ID ${id} não encontrado ou não pertence a este usuário.`);
    }

    delete (lote as any).propriedade;
    return formatDateFields(this.parseGeoMapa(lote));
  }

  async update(id: string, updateLoteDto: UpdateLoteDto, user: any) {
    const loteExistente = await this.findOne(id, user); // Valida a posse do lote que será atualizado

    // Determina a propriedade a ser validada (nova ou existente)
    const propriedadeParaValidar = updateLoteDto.idPropriedade || loteExistente.idPropriedade;

    // Se a propriedade estiver sendo alterada, valida a posse da nova propriedade
    if (updateLoteDto.idPropriedade) {
      const userId = await this.authHelper.getUserId(user);
      await this.validateOwnership(updateLoteDto.idPropriedade, userId);
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
