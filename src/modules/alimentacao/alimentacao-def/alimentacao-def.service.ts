import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { AlimentacaoDefRepositoryDrizzle } from './repositories/alimentacao-def.repository.drizzle';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { calculatePaginationParams, createPaginatedResponse } from '../../../core/utils/pagination.utils';

@Injectable()
export class AlimentacaoDefService {
  constructor(
    private readonly alimentacaoDefRepo: AlimentacaoDefRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(createAlimentacaoDefDto: CreateAlimentacaoDefDto) {
    const { data, error } = await this.alimentacaoDefRepo.create(createAlimentacaoDefDto);

    if (error || !data) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a alimentação definida.');
    }

    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros
    const { count: totalCount, error: countError } = await this.alimentacaoDefRepo.countAll();

    if (countError) {
      this.logger.logError(countError, { module: 'AlimentacaoDef', method: 'findAll', step: 'count' });
      throw new InternalServerErrorException('Falha ao contar as alimentações definidas.');
    }

    // Busca registros paginados
    const { data, error } = await this.alimentacaoDefRepo.findAll(limit, offset);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas.');
    }

    const formattedData = formatDateFieldsArray(data ?? []);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findByPropriedade(idPropriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros da propriedade
    const { count: totalCount, error: countError } = await this.alimentacaoDefRepo.countByPropriedade(idPropriedade);

    if (countError) {
      this.logger.logError(countError, {
        module: 'AlimentacaoDef',
        method: 'findByPropriedade',
        idPropriedade: String(idPropriedade),
        step: 'count',
      });
      throw new InternalServerErrorException('Falha ao contar as alimentações definidas da propriedade.');
    }

    // Busca registros paginados
    const { data, error } = await this.alimentacaoDefRepo.findByPropriedade(idPropriedade, limit, offset);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'findByPropriedade', idPropriedade: String(idPropriedade) });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas da propriedade.');
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findOne(id_aliment_def: string) {
    const { data, error } = await this.alimentacaoDefRepo.findOne(id_aliment_def);
    if (error || !data) throw new NotFoundException('Alimentação definida não encontrada.');
    return formatDateFields(data);
  }

  async update(id: string, updateAlimentacaoDefDto: UpdateAlimentacaoDefDto) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { data, error } = await this.alimentacaoDefRepo.update(id, updateAlimentacaoDefDto);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'update', id });
      throw new InternalServerErrorException('Falha ao atualizar a alimentação definida.');
    }

    return formatDateFields(data!);
  }

  async remove(id: string) {
    // Primeiro verifica se a alimentação definida existe
    await this.findOne(id);

    const { error } = await this.alimentacaoDefRepo.remove(id);

    if (error) {
      this.logger.logError(error, { module: 'AlimentacaoDef', method: 'remove', id });
      throw new InternalServerErrorException('Falha ao deletar a alimentação definida.');
    }

    return { message: 'Alimentação definida deletada com sucesso.' };
  }
}
