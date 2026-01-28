import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { UpdateMedicacaoDto } from './dto/update-medicacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { MedicamentosRepositoryDrizzle } from './repositories';

@Injectable()
export class MedicamentosService implements ISoftDelete {
  constructor(
    private readonly repository: MedicamentosRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateMedicacaoDto) {
    const data = await this.repository.create(dto);
    return formatDateFields(data);
  }

  async findAll() {
    const data = await this.repository.findAll();
    return formatDateFieldsArray(data);
  }

  async findByPropriedade(id_propriedade: string) {
    const data = await this.repository.findByPropriedade(id_propriedade);
    return formatDateFieldsArray(data);
  }

  async findOne(id_medicacao: string) {
    const data = await this.repository.findById(id_medicacao);

    if (!data) {
      throw new NotFoundException(`Medicação com ID ${id_medicacao} não encontrada.`);
    }

    return formatDateFields(data);
  }

  async update(id_medicacao: string, dto: UpdateMedicacaoDto) {
    await this.findOne(id_medicacao); // Garante que existe

    const data = await this.repository.update(id_medicacao, dto);
    return formatDateFields(data);
  }

  async remove(id_medicacao: string) {
    return this.softDelete(id_medicacao);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const data = await this.repository.softDelete(id);

    return {
      message: 'Medicação removida com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const registro = await this.repository.findById(id);

    if (!registro) {
      throw new NotFoundException(`Medicação com ID ${id} não encontrada`);
    }

    if (!registro.deletedAt) {
      throw new BadRequestException('Esta medicação não está removida');
    }

    const data = await this.repository.restore(id);

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
