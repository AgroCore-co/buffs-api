import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { GrupoRepositoryDrizzle } from './repositories/grupo.repository.drizzle';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService } from '../../../core/cache/cache.service';

@Injectable()
export class GrupoService implements ISoftDelete {
  constructor(
    private readonly grupoRepository: GrupoRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
    private readonly cacheService: CacheService,
  ) {}

  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }

  private async validatePropriedadeAccess(userId: string, idPropriedade?: string | null): Promise<void> {
    if (!idPropriedade) {
      throw new NotFoundException('Grupo sem propriedade vinculada.');
    }

    await this.authHelper.validatePropriedadeAccess(userId, idPropriedade);
  }

  private async findGrupoForUser(id: string, userId: string, includeDeleted = false) {
    const grupo = includeDeleted ? await this.grupoRepository.findByIdWithDeleted(id) : await this.grupoRepository.findById(id);

    if (!grupo) {
      this.logger.warn('Grupo não encontrado', { module: 'GrupoService', method: 'findGrupoForUser', grupoId: id });
      throw new NotFoundException('Grupo não encontrado.');
    }

    await this.validatePropriedadeAccess(userId, grupo.idPropriedade);
    return grupo;
  }

  async create(createGrupoDto: CreateGrupoDto, user: any) {
    this.logger.log('Iniciando criação de grupo', { module: 'GrupoService', method: 'create' });

    const userId = await this.authHelper.getUserId(user);
    await this.validatePropriedadeAccess(userId, createGrupoDto.idPropriedade);

    const data = await this.grupoRepository.create(createGrupoDto);
    await this.invalidateCache();

    this.logger.log('Grupo criado com sucesso', { module: 'GrupoService', method: 'create', grupoId: data.idGrupo });
    return formatDateFields(data);
  }

  async findAll(user: any) {
    this.logger.log('Iniciando busca de todos os grupos', { module: 'GrupoService', method: 'findAll' });

    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const data = await this.grupoRepository.findByPropriedades(propriedadesUsuario);

    this.logger.log(`Busca de grupos concluída - ${data.length} grupos encontrados`, { module: 'GrupoService', method: 'findAll' });
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}, user: any): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de grupos por propriedade', {
      module: 'GrupoService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const userId = await this.authHelper.getUserId(user);
    await this.validatePropriedadeAccess(userId, id_propriedade);

    const { page = 1, limit = 10 } = paginationDto;
    const { limit: limitValue } = calculatePaginationParams(page, limit);

    const { registros, total } = await this.grupoRepository.findByPropriedade(id_propriedade, page, limitValue);

    this.logger.log(`Busca concluída - ${registros.length} grupos encontrados (página ${page})`, {
      module: 'GrupoService',
      method: 'findByPropriedade',
    });

    const formattedData = formatDateFieldsArray(registros);
    return createPaginatedResponse(formattedData, total, page, limitValue);
  }

  async findOne(id: string, user: any) {
    this.logger.log('Iniciando busca de grupo por ID', { module: 'GrupoService', method: 'findOne', grupoId: id });

    const userId = await this.authHelper.getUserId(user);
    const data = await this.findGrupoForUser(id, userId);

    this.logger.log('Grupo encontrado com sucesso', { module: 'GrupoService', method: 'findOne', grupoId: id });
    return formatDateFields(data);
  }

  async update(id: string, updateGrupoDto: UpdateGrupoDto, user: any) {
    this.logger.log('Iniciando atualização de grupo', { module: 'GrupoService', method: 'update', grupoId: id });

    const userId = await this.authHelper.getUserId(user);
    await this.findGrupoForUser(id, userId);

    if (updateGrupoDto.idPropriedade) {
      await this.validatePropriedadeAccess(userId, updateGrupoDto.idPropriedade);
    }

    const data = await this.grupoRepository.update(id, updateGrupoDto);
    await this.invalidateCache();

    this.logger.log('Grupo atualizado com sucesso', { module: 'GrupoService', method: 'update', grupoId: id });
    return formatDateFields(data);
  }

  async remove(id: string, user: any) {
    return this.softDelete(id, user);
  }

  async softDelete(id: string, user: any) {
    this.logger.log('Iniciando remoção de grupo (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });

    const userId = await this.authHelper.getUserId(user);

    await this.findGrupoForUser(id, userId);

    const data = await this.grupoRepository.softDelete(id);
    await this.invalidateCache();

    this.logger.log('Grupo removido com sucesso (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });
    return {
      message: 'Grupo removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string, user: any) {
    this.logger.log('Iniciando restauração de grupo', { module: 'GrupoService', method: 'restore', grupoId: id });

    const userId = await this.authHelper.getUserId(user);

    const grupo = await this.findGrupoForUser(id, userId, true);

    if (!grupo.deletedAt) {
      throw new BadRequestException('Este grupo não está removido');
    }

    const data = await this.grupoRepository.restore(id);
    await this.invalidateCache();

    this.logger.log('Grupo restaurado com sucesso', { module: 'GrupoService', method: 'restore', grupoId: id });
    return {
      message: 'Grupo restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(user: any): Promise<any[]> {
    this.logger.log('Buscando todos os grupos incluindo deletados', { module: 'GrupoService', method: 'findAllWithDeleted' });

    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);

    const data = await this.grupoRepository.findAllWithDeletedByPropriedades(propriedadesUsuario);

    return formatDateFieldsArray(data || []);
  }
}
