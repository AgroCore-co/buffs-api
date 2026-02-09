import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateDadoZootecnicoDto } from './dto/create-dado-zootecnico.dto';
import { UpdateDadoZootecnicoDto } from './dto/update-dado-zootecnico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { DadosZootecnicosRepositoryDrizzle } from './repositories';
import { DatabaseService } from '../../../core/database/database.service';
import { UserHelper } from '../../../core/utils';

@Injectable()
export class DadosZootecnicosService implements ISoftDelete {
  constructor(
    private readonly repository: DadosZootecnicosRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * O parâmetro final 'auth_uuid' é o 'sub' (string UUID) vindo do controller.
   */
  async create(dto: CreateDadoZootecnicoDto, id_bufalo: string, auth_uuid: string) {
    // Buscar o ID (UUID) usando o Auth UUID via helper
    const internalUserId = await UserHelper.getInternalUserId(this.databaseService, auth_uuid);

    // Inserir no repository
    const data = await this.repository.createFromDto(dto, id_bufalo, internalUserId);

    return formatDateFields(data);
  }

  async findAllByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findAllByBufalo(id_bufalo, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findAllByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findAllByPropriedade(id_propriedade, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findOne(id_zootec: string) {
    const data = await this.repository.findById(id_zootec);

    if (!data) {
      throw new NotFoundException(`Dado zootécnico com ID ${id_zootec} não encontrado.`);
    }

    return formatDateFields(data);
  }

  async update(id_zootec: string, dto: UpdateDadoZootecnicoDto) {
    await this.findOne(id_zootec);

    const data = await this.repository.updateFromDto(id_zootec, dto);

    return formatDateFields(data);
  }

  async remove(id_zootec: string) {
    return this.softDelete(id_zootec);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const data = await this.repository.softDelete(id);

    return {
      message: 'Registro removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const registro = await this.repository.findById(id);

    if (!registro) {
      throw new NotFoundException(`Dado zootécnico com ID ${id} não encontrado`);
    }

    if (!registro.deletedAt) {
      throw new BadRequestException('Este registro não está removido');
    }

    const data = await this.repository.restore(id);

    return {
      message: 'Registro restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const data = await this.repository.findAllWithDeleted();
    return formatDateFieldsArray(data);
  }
}
