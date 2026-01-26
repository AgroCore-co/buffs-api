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

@Injectable()
export class GrupoService implements ISoftDelete {
  constructor(
    private readonly grupoRepository: GrupoRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(createGrupoDto: CreateGrupoDto) {
    this.logger.log('Iniciando criação de grupo', { module: 'GrupoService', method: 'create' });

    const data = await this.grupoRepository.create(createGrupoDto);

    this.logger.log('Grupo criado com sucesso', { module: 'GrupoService', method: 'create', grupoId: data.idGrupo });
    return formatDateFields(data);
  }

  async findAll() {
    this.logger.log('Iniciando busca de todos os grupos', { module: 'GrupoService', method: 'findAll' });

    const data = await this.grupoRepository.findAll();

    this.logger.log(`Busca de grupos concluída - ${data.length} grupos encontrados`, { module: 'GrupoService', method: 'findAll' });
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de grupos por propriedade', {
      module: 'GrupoService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

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

  async findOne(id: string) {
    this.logger.log('Iniciando busca de grupo por ID', { module: 'GrupoService', method: 'findOne', grupoId: id });

    const data = await this.grupoRepository.findById(id);

    if (!data) {
      this.logger.warn('Grupo não encontrado', { module: 'GrupoService', method: 'findOne', grupoId: id });
      throw new NotFoundException('Grupo não encontrado.');
    }

    this.logger.log('Grupo encontrado com sucesso', { module: 'GrupoService', method: 'findOne', grupoId: id });
    return formatDateFields(data);
  }

  async update(id: string, updateGrupoDto: UpdateGrupoDto) {
    this.logger.log('Iniciando atualização de grupo', { module: 'GrupoService', method: 'update', grupoId: id });

    // Primeiro verifica se o grupo existe
    await this.findOne(id);

    const data = await this.grupoRepository.update(id, updateGrupoDto);

    this.logger.log('Grupo atualizado com sucesso', { module: 'GrupoService', method: 'update', grupoId: id });
    return formatDateFields(data);
  }

  async remove(id: string) {
    return this.softDelete(id);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de grupo (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });

    await this.findOne(id);

    const data = await this.grupoRepository.softDelete(id);

    this.logger.log('Grupo removido com sucesso (soft delete)', { module: 'GrupoService', method: 'softDelete', grupoId: id });
    return {
      message: 'Grupo removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de grupo', { module: 'GrupoService', method: 'restore', grupoId: id });

    const grupo = await this.grupoRepository.findByIdWithDeleted(id);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id} não encontrado`);
    }

    if (!grupo.deletedAt) {
      throw new BadRequestException('Este grupo não está removido');
    }

    const data = await this.grupoRepository.restore(id);

    this.logger.log('Grupo restaurado com sucesso', { module: 'GrupoService', method: 'restore', grupoId: id });
    return {
      message: 'Grupo restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todos os grupos incluindo deletados', { module: 'GrupoService', method: 'findAllWithDeleted' });

    const data = await this.grupoRepository.findAllWithDeleted();

    return formatDateFieldsArray(data || []);
  }
}
