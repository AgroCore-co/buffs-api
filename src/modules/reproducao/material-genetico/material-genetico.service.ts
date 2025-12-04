import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateMaterialGeneticoDto } from './dto/create-material-genetico.dto';
import { UpdateMaterialGeneticoDto } from './dto/update-material-genetico.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse, calculatePaginationParams } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { MaterialGeneticoRepositoryDrizzle } from './repositories/material-genetico.repository.drizzle';

@Injectable()
export class MaterialGeneticoService implements ISoftDelete {
  constructor(
    private readonly materialRepo: MaterialGeneticoRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(createMaterialGeneticoDto: CreateMaterialGeneticoDto) {
    const module = 'MaterialGeneticoService';
    const method = 'create';
    this.logger.log('Criando novo material genético', { module, method });

    try {
      const dadosLimpos = {
        idPropriedade: createMaterialGeneticoDto.id_propriedade,
        tipo: createMaterialGeneticoDto.tipo,
        origem: createMaterialGeneticoDto.origem,
        ...(createMaterialGeneticoDto.id_bufalo_origem && { idBufaloOrigem: createMaterialGeneticoDto.id_bufalo_origem }),
        ...(createMaterialGeneticoDto.fornecedor && { fornecedor: createMaterialGeneticoDto.fornecedor }),
        dataColeta: createMaterialGeneticoDto.data_coleta,
      };

      this.logger.debug('Dados preparados para inserção', { module, method, dadosLimpos });

      const data = await this.materialRepo.create(dadosLimpos);

      this.logger.log('Material genético criado com sucesso', { module, method, id_material: data.idMaterial });

      return {
        message: 'Material genético criado com sucesso',
        data,
      };
    } catch (error) {
      this.logger.error('Erro ao criar material genético', error.message, { module, method });
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findAll';
    this.logger.log('Buscando todos os materiais genéticos', { module, method });

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const result = await this.materialRepo.findAll(offset, limitValue);

      this.logger.log('Materiais genéticos encontrados', { module, method, count: result.data.length, page });

      return createPaginatedResponse(result.data, result.total, page, limitValue);
    } catch (error) {
      this.logger.error('Erro ao buscar material genético', error.message, { module, method });
      throw error;
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findByPropriedade';
    this.logger.log('Buscando materiais genéticos por propriedade', { module, method, id_propriedade });

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const result = await this.materialRepo.findByPropriedade(id_propriedade, offset, limitValue);

      this.logger.log('Materiais genéticos encontrados na propriedade', { module, method, count: result.data.length, page });

      return createPaginatedResponse(result.data, result.total, page, limitValue);
    } catch (error) {
      this.logger.error('Erro ao buscar por propriedade', error.message, { module, method });
      throw error;
    }
  }

  async findOne(id_material: string) {
    const data = await this.materialRepo.findById(id_material);

    if (!data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }
    return data;
  }

  async update(id_material: string, dto: UpdateMaterialGeneticoDto) {
    const module = 'MaterialGeneticoService';
    const method = 'update';
    this.logger.log('Atualizando material genético', { module, method, id_material });

    // Verifica se existe
    await this.findOne(id_material);

    try {
      const cleanedDto = {
        ...(dto.id_propriedade && { idPropriedade: dto.id_propriedade }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.origem && { origem: dto.origem }),
        ...(dto.id_bufalo_origem !== undefined && { idBufaloOrigem: dto.id_bufalo_origem }),
        ...(dto.fornecedor !== undefined && { fornecedor: dto.fornecedor }),
        ...(dto.data_coleta && { dataColeta: dto.data_coleta }),
      };

      this.logger.debug('Dados preparados para atualização', { module, method, cleanedDto });

      const data = await this.materialRepo.update(id_material, cleanedDto);

      if (!data) {
        throw new InternalServerErrorException('Falha ao atualizar material genético');
      }

      this.logger.log('Material genético atualizado com sucesso', { module, method, id_material });
      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error('Erro inesperado ao atualizar', error.message, { module, method });
      throw new InternalServerErrorException(`Erro interno ao atualizar material genético: ${error.message}`);
    }
  }

  async remove(id_material: string) {
    return this.softDelete(id_material);
  }

  async softDelete(id: string) {
    const module = 'MaterialGeneticoService';
    const method = 'softDelete';
    this.logger.log('Removendo material genético (soft delete)', { module, method, id_material: id });

    await this.findOne(id);

    const data = await this.materialRepo.softDelete(id);

    this.logger.log('Material genético removido com sucesso (soft delete)', { module, method, id_material: id });
    return {
      message: 'Material genético removido com sucesso (soft delete)',
      data,
    };
  }

  async restore(id: string) {
    const module = 'MaterialGeneticoService';
    const method = 'restore';
    this.logger.log('Restaurando material genético', { module, method, id_material: id });

    const material = await this.materialRepo.findById(id);

    if (!material) {
      throw new NotFoundException(`Material genético com ID ${id} não encontrado`);
    }

    if (!material.deletedAt) {
      throw new BadRequestException('Este material genético não está removido');
    }

    const data = await this.materialRepo.restore(id);

    this.logger.log('Material genético restaurado com sucesso', { module, method, id_material: id });
    return {
      message: 'Material genético restaurado com sucesso',
      data,
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const module = 'MaterialGeneticoService';
    const method = 'findAllWithDeleted';
    this.logger.log('Buscando todos os materiais genéticos incluindo deletados', { module, method });

    return await this.materialRepo.findAllWithDeleted();
  }
}
