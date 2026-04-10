import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { CreateRegistroPayload, RegistrosRepositoryDrizzle } from './repositories/registros.repository.drizzle';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { calculatePaginationParams, createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { AuthHelperService } from '../../../core/services/auth-helper.service';

type RegistroEntity = {
  idRegistro: string;
  idPropriedade: string | null;
  idGrupo: string | null;
  idAlimentDef: string | null;
  idUsuario: string | null;
  quantidade: string | null;
  unidadeMedida: string | null;
  freqDia: number | null;
  dtRegistro: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

@Injectable()
export class RegistrosService {
  constructor(
    private readonly registrosRepo: RegistrosRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
  ) {}

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private async findOneOrThrow(idRegistro: string): Promise<RegistroEntity> {
    const { data, error } = await this.registrosRepo.findOne(idRegistro);

    if (error || !data) {
      throw new NotFoundException('Registro de alimentação não encontrado.');
    }

    return data;
  }

  private async validateOwnership(userId: string, idPropriedade: string | null): Promise<void> {
    if (!idPropriedade) {
      throw new NotFoundException('Registro de alimentação sem propriedade vinculada.');
    }

    await this.authHelper.validatePropriedadeAccess(userId, idPropriedade);
  }

  async create(dto: CreateRegistroPayload) {
    await this.validateOwnership(dto.id_usuario, dto.id_propriedade);

    const { data, error, validationError } = await this.registrosRepo.create(dto);

    if (validationError === 'GROUP_NOT_FOUND') {
      throw new NotFoundException('Grupo não encontrado.');
    }

    if (validationError === 'GROUP_PROPERTY_MISMATCH') {
      throw new BadRequestException('O grupo informado não pertence à propriedade especificada.');
    }

    if (validationError === 'ALIMENT_DEF_NOT_FOUND') {
      throw new NotFoundException('Definição de alimentação não encontrada.');
    }

    if (validationError === 'ALIMENT_DEF_PROPERTY_MISMATCH') {
      throw new BadRequestException('A definição de alimentação informada não pertence à propriedade especificada.');
    }

    if (validationError === 'INSERT_FAILED') {
      throw new InternalServerErrorException('Falha ao criar registro de alimentação.');
    }

    if (error || !data) {
      this.logger.logError(this.toError(error), { module: 'RegistrosAlimentacao', method: 'create' });
      const errorMessage = error instanceof Error ? error.message : 'erro desconhecido';
      throw new InternalServerErrorException(`Falha ao criar registro de alimentação: ${errorMessage}`);
    }

    return formatDateFields(data);
  }

  async findByPropriedade(idPropriedade: string, paginationDto: PaginationDto = {}, userId: string): Promise<PaginatedResponse<unknown>> {
    await this.validateOwnership(userId, idPropriedade);

    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros da propriedade
    const { count: totalCount, error: countError } = await this.registrosRepo.countByPropriedade(idPropriedade);

    if (countError) {
      this.logger.logError(this.toError(countError), {
        module: 'RegistrosAlimentacao',
        method: 'findByPropriedade',
        idPropriedade,
        step: 'count',
      });
      throw new InternalServerErrorException('Falha ao contar registros de alimentação da propriedade.');
    }

    // Busca registros paginados com relações
    const { data, error } = await this.registrosRepo.findByPropriedade(idPropriedade, limit, offset);

    if (error) {
      this.logger.logError(this.toError(error), { module: 'RegistrosAlimentacao', method: 'findByPropriedade', idPropriedade });
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação da propriedade.');
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findOne(id_registro: string, userId: string) {
    const data = await this.findOneOrThrow(id_registro);
    await this.validateOwnership(userId, data.idPropriedade);
    return formatDateFields(data);
  }

  async update(id_registro: string, dto: UpdateRegistroAlimentacaoDto, userId: string) {
    const existing = await this.findOneOrThrow(id_registro);
    await this.validateOwnership(userId, existing.idPropriedade);

    const { data, error } = await this.registrosRepo.update(id_registro, dto);
    if (error || !data) throw new InternalServerErrorException('Falha ao atualizar registro de alimentação.');
    return formatDateFields(data);
  }

  async remove(id_registro: string, userId: string): Promise<void> {
    const existing = await this.findOneOrThrow(id_registro);
    await this.validateOwnership(userId, existing.idPropriedade);

    const { error } = await this.registrosRepo.remove(id_registro);
    if (error) throw new InternalServerErrorException('Falha ao remover registro de alimentação.');
  }
}
