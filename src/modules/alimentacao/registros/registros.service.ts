import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateRegistroAlimentacaoDto } from './dto/create-registro.dto';
import { UpdateRegistroAlimentacaoDto } from './dto/update-registro.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { RegistrosRepositoryDrizzle } from './repositories/registros.repository.drizzle';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { calculatePaginationParams, createPaginatedResponse } from '../../../core/utils/pagination.utils';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly registrosRepo: RegistrosRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateRegistroAlimentacaoDto) {
    // Validar se o grupo pertence à propriedade
    const { data: grupo, error: grupoError } = await this.registrosRepo.findGrupoById(dto.id_grupo);

    if (grupoError || !grupo) {
      this.logger.logError(grupoError, { module: 'RegistrosAlimentacao', method: 'create', step: 'validacao_grupo' });
      throw new NotFoundException('Grupo não encontrado.');
    }

    if (grupo.idPropriedade !== dto.id_propriedade) {
      throw new BadRequestException('O grupo informado não pertence à propriedade especificada.');
    }

    // Validar se a definição de alimentação pertence à propriedade
    const { data: alimentDef, error: alimentError } = await this.registrosRepo.findAlimentDefById(dto.id_aliment_def);

    if (alimentError || !alimentDef) {
      this.logger.logError(alimentError, { module: 'RegistrosAlimentacao', method: 'create', step: 'validacao_alimentacao_def' });
      throw new NotFoundException('Definição de alimentação não encontrada.');
    }

    if (alimentDef.idPropriedade !== dto.id_propriedade) {
      throw new BadRequestException('A definição de alimentação informada não pertence à propriedade especificada.');
    }

    // Criar o registro de alimentação
    const { data, error } = await this.registrosRepo.create(dto);
    if (error || !data) {
      this.logger.logError(error, { module: 'RegistrosAlimentacao', method: 'create' });
      throw new InternalServerErrorException(`Falha ao criar registro de alimentação: ${error?.message}`);
    }
    return formatDateFields(data);
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros
    const { count: totalCount, error: countError } = await this.registrosRepo.countAll();

    if (countError) {
      this.logger.logError(countError, { module: 'RegistrosAlimentacao', method: 'findAll', step: 'count' });
      throw new InternalServerErrorException('Falha ao contar registros de alimentação.');
    }

    // Busca registros paginados
    const { data, error } = await this.registrosRepo.findAll(limit, offset);

    if (error) {
      this.logger.logError(error, { module: 'RegistrosAlimentacao', method: 'findAll' });
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação.');
    }

    const formattedData = formatDateFieldsArray(data ?? []);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findByPropriedade(idPropriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    // Busca total de registros da propriedade
    const { count: totalCount, error: countError } = await this.registrosRepo.countByPropriedade(idPropriedade);

    if (countError) {
      this.logger.logError(countError, {
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
      this.logger.logError(error, { module: 'RegistrosAlimentacao', method: 'findByPropriedade', idPropriedade });
      throw new InternalServerErrorException('Falha ao buscar registros de alimentação da propriedade.');
    }

    const formattedData = formatDateFieldsArray(data);
    return createPaginatedResponse(formattedData, totalCount, page, limit);
  }

  async findOne(id_registro: string) {
    const { data, error } = await this.registrosRepo.findOne(id_registro);
    if (error || !data) throw new NotFoundException('Registro de alimentação não encontrado.');
    return formatDateFields(data);
  }

  async update(id_registro: string, dto: UpdateRegistroAlimentacaoDto) {
    await this.findOne(id_registro);
    const { data, error } = await this.registrosRepo.update(id_registro, dto);
    if (error || !data) throw new InternalServerErrorException('Falha ao atualizar registro de alimentação.');
    return formatDateFields(data);
  }

  async remove(id_registro: string) {
    await this.findOne(id_registro);
    const { error } = await this.registrosRepo.remove(id_registro);
    if (error) throw new InternalServerErrorException('Falha ao remover registro de alimentação.');
    return { message: 'Registro removido com sucesso' };
  }
}
