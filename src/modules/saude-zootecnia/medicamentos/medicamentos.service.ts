import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from './dto/update-medicacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { MedicamentosRepositoryDrizzle } from './repositories';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CacheService, CacheTTL } from '../../../core/cache';

@Injectable()
export class MedicamentosService implements ISoftDelete {
  constructor(
    private readonly repository: MedicamentosRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
    private readonly cacheService: CacheService,
  ) {}

  private getPropriedadeCacheKey(idPropriedade: string): string {
    return `medicacoes:propriedade:${idPropriedade}`;
  }

  private async invalidatePropriedadeCache(idPropriedade?: string | null): Promise<void> {
    if (!idPropriedade) return;
    await this.cacheService.del(this.getPropriedadeCacheKey(idPropriedade));
  }

  async create(dto: CreateMedicacaoDto) {
    const data = await this.repository.createFromDto(dto);
    await this.invalidatePropriedadeCache(dto.idPropriedade);
    return formatDateFields(data);
  }

  async findAll() {
    const data = await this.repository.findAll();
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string, userId: string) {
    await this.authHelper.validatePropriedadeAccess(userId, id_propriedade);

    const cacheKey = this.getPropriedadeCacheKey(id_propriedade);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const data = await this.repository.findByPropriedade(id_propriedade);
        return formatDateFieldsArray(data);
      },
      CacheTTL.LONG,
    );
  }

  async findOne(id_medicacao: string) {
    const data = await this.repository.findById(id_medicacao);

    if (!data) {
      throw new NotFoundException(`Medicação com ID ${id_medicacao} não encontrada.`);
    }

    return formatDateFields(data);
  }

  async update(id_medicacao: string, dto: UpdateMedicacaoDto) {
    const existente = await this.repository.findById(id_medicacao);

    if (!existente) {
      throw new NotFoundException(`Medicação com ID ${id_medicacao} não encontrada.`);
    }

    const data = await this.repository.updateFromDto(id_medicacao, dto);

    await this.invalidatePropriedadeCache(existente.idPropriedade);
    if (dto.idPropriedade && dto.idPropriedade !== existente.idPropriedade) {
      await this.invalidatePropriedadeCache(dto.idPropriedade);
    }

    return formatDateFields(data);
  }

  async remove(id_medicacao: string) {
    return this.softDelete(id_medicacao);
  }

  async softDelete(id: string) {
    const existente = await this.repository.findById(id);

    if (!existente) {
      throw new NotFoundException(`Medicação com ID ${id} não encontrada.`);
    }

    const data = await this.repository.softDelete(id);

    await this.invalidatePropriedadeCache(existente.idPropriedade);

    return {
      message: 'Medicação removida com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const registro = await this.repository.findByIdIncludingDeleted(id);

    if (!registro) {
      throw new NotFoundException(`Medicação com ID ${id} não encontrada`);
    }

    if (!registro.deletedAt) {
      throw new BadRequestException('Esta medicação não está removida');
    }

    const data = await this.repository.restore(id);

    await this.invalidatePropriedadeCache(registro.idPropriedade);

    return {
      message: 'Medicação restaurada com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const data = await this.repository.findAllWithDeleted();
    return formatDateFieldsArray(data);
  }
}
