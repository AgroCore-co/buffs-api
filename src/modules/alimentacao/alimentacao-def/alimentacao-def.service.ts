import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAlimentacaoDefDto } from './dto/create-alimentacao-def.dto';
import { UpdateAlimentacaoDefDto } from './dto/update-alimentacao-def.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { AlimentacaoDefRepositoryDrizzle } from './repositories/alimentacao-def.repository.drizzle';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { calculatePaginationParams, createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService } from '../../../core/cache/cache.service';

type AlimentacaoDefEntity = {
  idAlimentDef: string;
  idPropriedade: string | null;
  tipoAlimentacao: string;
  descricao: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

@Injectable()
export class AlimentacaoDefService {
  constructor(
    private readonly alimentacaoDefRepo: AlimentacaoDefRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
    private readonly cacheService: CacheService,
  ) {}

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private async findOneOrThrow(idAlimentDef: string): Promise<AlimentacaoDefEntity> {
    const { data, error } = await this.alimentacaoDefRepo.findOne(idAlimentDef);

    if (error || !data) {
      throw new NotFoundException('Alimentação definida não encontrada.');
    }

    return data;
  }

  private async validateOwnership(userId: string, idPropriedade: string | null): Promise<void> {
    if (!idPropriedade) {
      throw new NotFoundException('Alimentação definida sem propriedade vinculada.');
    }

    await this.authHelper.validatePropriedadeAccess(userId, idPropriedade);
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheService.reset();
  }

  async create(createAlimentacaoDefDto: CreateAlimentacaoDefDto, userId: string) {
    await this.validateOwnership(userId, createAlimentacaoDefDto.id_propriedade);

    const { data, error } = await this.alimentacaoDefRepo.create(createAlimentacaoDefDto);

    if (error || !data) {
      this.logger.logError(this.toError(error), { module: 'AlimentacaoDef', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a alimentação definida.');
    }

    await this.invalidateCache();

    return formatDateFields(data);
  }

  async findByPropriedade(idPropriedade: string, paginationDto: PaginationDto = {}, userId: string): Promise<PaginatedResponse<unknown>> {
    await this.validateOwnership(userId, idPropriedade);

    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros da propriedade
    const { count: totalCount, error: countError } = await this.alimentacaoDefRepo.countByPropriedade(idPropriedade);

    if (countError) {
      this.logger.logError(this.toError(countError), {
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
      this.logger.logError(this.toError(error), { module: 'AlimentacaoDef', method: 'findByPropriedade', idPropriedade: String(idPropriedade) });
      throw new InternalServerErrorException('Falha ao buscar as alimentações definidas da propriedade.');
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findOne(id_aliment_def: string, userId: string) {
    const data = await this.findOneOrThrow(id_aliment_def);
    await this.validateOwnership(userId, data.idPropriedade);
    return formatDateFields(data);
  }

  async update(id: string, updateAlimentacaoDefDto: UpdateAlimentacaoDefDto, userId: string) {
    const existing = await this.findOneOrThrow(id);
    await this.validateOwnership(userId, existing.idPropriedade);

    const { data, error } = await this.alimentacaoDefRepo.update(id, updateAlimentacaoDefDto);

    if (error || !data) {
      this.logger.logError(this.toError(error), { module: 'AlimentacaoDef', method: 'update', id });
      throw new InternalServerErrorException('Falha ao atualizar a alimentação definida.');
    }

    await this.invalidateCache();

    return formatDateFields(data);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.findOneOrThrow(id);
    await this.validateOwnership(userId, existing.idPropriedade);

    const { error } = await this.alimentacaoDefRepo.remove(id);

    if (error) {
      this.logger.logError(this.toError(error), { module: 'AlimentacaoDef', method: 'remove', id });
      throw new InternalServerErrorException('Falha ao deletar a alimentação definida.');
    }

    await this.invalidateCache();
  }
}
