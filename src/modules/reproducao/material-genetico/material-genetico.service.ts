import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
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
    private readonly authHelper: AuthHelperService,
  ) {}

  private async validarOwnership(user: any, idPropriedade: string | null | undefined): Promise<void> {
    if (!idPropriedade) {
      throw new NotFoundException('Registro sem propriedade vinculada.');
    }

    const userId = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(userId, idPropriedade);
  }

  private validarCruzadaOrigem(
    dados: {
      origem?: string | null;
      idBufaloOrigem?: string | null;
      fornecedor?: string | null;
    },
    method: string,
  ): void {
    const module = 'MaterialGeneticoService';
    const origem = dados.origem?.trim();
    const hasBufaloOrigem = !!dados.idBufaloOrigem;
    const hasFornecedor = typeof dados.fornecedor === 'string' && dados.fornecedor.trim().length > 0;

    if (origem === 'Coleta Própria') {
      if (!hasBufaloOrigem) {
        throw new BadRequestException('Para origem "Coleta Própria", idBufaloOrigem é obrigatório.');
      }

      if (hasFornecedor) {
        this.logger.warn('Fornecedor informado para origem Coleta Própria; campo será rejeitado para manter consistência.', {
          module,
          method,
        });
        throw new BadRequestException('Para origem "Coleta Própria", fornecedor não deve ser informado.');
      }
    }

    if (origem === 'Compra') {
      if (!hasFornecedor) {
        throw new BadRequestException('Para origem "Compra", fornecedor é obrigatório.');
      }

      if (hasBufaloOrigem) {
        this.logger.warn('idBufaloOrigem informado para origem Compra; campo será rejeitado para manter consistência.', {
          module,
          method,
        });
        throw new BadRequestException('Para origem "Compra", idBufaloOrigem não deve ser informado.');
      }
    }
  }

  async create(createMaterialGeneticoDto: CreateMaterialGeneticoDto, user: any) {
    const module = 'MaterialGeneticoService';
    const method = 'create';
    this.logger.log('Criando novo material genético', { module, method });

    try {
      await this.validarOwnership(user, createMaterialGeneticoDto.idPropriedade);
      this.validarCruzadaOrigem(createMaterialGeneticoDto, method);

      const dadosLimpos = {
        idPropriedade: createMaterialGeneticoDto.idPropriedade,
        tipo: createMaterialGeneticoDto.tipo,
        origem: createMaterialGeneticoDto.origem,
        ...(createMaterialGeneticoDto.idBufaloOrigem && { idBufaloOrigem: createMaterialGeneticoDto.idBufaloOrigem }),
        ...(createMaterialGeneticoDto.fornecedor && { fornecedor: createMaterialGeneticoDto.fornecedor }),
        dataColeta: createMaterialGeneticoDto.dataColeta,
      };

      this.logger.debug('Dados preparados para inserção', { module, method, dadosLimpos });

      const data = await this.materialRepo.create(dadosLimpos);

      this.logger.log('Material genético criado com sucesso', { module, method, id_material: data.idMaterial });

      return {
        message: 'Material genético criado com sucesso',
        data,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Erro ao criar material genético', err.stack, { module, method });
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto = {}, user: any): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findAll';
    this.logger.log('Buscando todos os materiais genéticos', { module, method });

    try {
      const userId = await this.authHelper.getUserId(user);
      const propriedades = await this.authHelper.getUserPropriedades(userId);

      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const result = await this.materialRepo.findAllByPropriedadesPaginated(propriedades, offset, limitValue);

      this.logger.log('Materiais genéticos encontrados', { module, method, count: result.data.length, page });

      return createPaginatedResponse(result.data, result.total, page, limitValue);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Erro ao buscar material genético', err.stack, { module, method });
      throw error;
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}, user: any): Promise<PaginatedResponse<any>> {
    const module = 'MaterialGeneticoService';
    const method = 'findByPropriedade';
    this.logger.log('Buscando materiais genéticos por propriedade', { module, method, id_propriedade });

    try {
      await this.validarOwnership(user, id_propriedade);

      const { page = 1, limit = 10 } = paginationDto;
      const { limit: limitValue, offset } = calculatePaginationParams(page, limit);

      const result = await this.materialRepo.findByPropriedade(id_propriedade, offset, limitValue);

      this.logger.log('Materiais genéticos encontrados na propriedade', { module, method, count: result.data.length, page });

      return createPaginatedResponse(result.data, result.total, page, limitValue);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Erro ao buscar por propriedade', err.stack, { module, method });
      throw error;
    }
  }

  async findOne(id_material: string, user: any) {
    const data = await this.materialRepo.findById(id_material);

    if (!data) {
      throw new NotFoundException(`Material genético com ID ${id_material} não encontrado.`);
    }

    await this.validarOwnership(user, data.idPropriedade);

    return data;
  }

  async update(id_material: string, dto: UpdateMaterialGeneticoDto, user: any) {
    const module = 'MaterialGeneticoService';
    const method = 'update';
    this.logger.log('Atualizando material genético', { module, method, id_material });

    // Verifica se existe
    const materialAtual = await this.findOne(id_material, user);

    try {
      if (dto.idPropriedade && dto.idPropriedade !== materialAtual.idPropriedade) {
        await this.validarOwnership(user, dto.idPropriedade);
      }

      this.validarCruzadaOrigem(
        {
          origem: dto.origem ?? materialAtual.origem,
          idBufaloOrigem: dto.idBufaloOrigem !== undefined ? dto.idBufaloOrigem : materialAtual.idBufaloOrigem,
          fornecedor: dto.fornecedor !== undefined ? dto.fornecedor : materialAtual.fornecedor,
        },
        method,
      );

      const cleanedDto = {
        ...(dto.idPropriedade && { idPropriedade: dto.idPropriedade }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.origem && { origem: dto.origem }),
        ...(dto.idBufaloOrigem !== undefined && { idBufaloOrigem: dto.idBufaloOrigem }),
        ...(dto.fornecedor !== undefined && { fornecedor: dto.fornecedor }),
        ...(dto.dataColeta && { dataColeta: dto.dataColeta }),
      };

      this.logger.debug('Dados preparados para atualização', { module, method, cleanedDto });

      const data = await this.materialRepo.update(id_material, cleanedDto);

      if (!data) {
        throw new InternalServerErrorException('Falha ao atualizar material genético');
      }

      this.logger.log('Material genético atualizado com sucesso', { module, method, id_material });
      return data;
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Erro inesperado ao atualizar', err.stack, { module, method });
      throw new InternalServerErrorException(`Erro interno ao atualizar material genético: ${err.message}`);
    }
  }

  async remove(id_material: string, user: any) {
    return this.softDelete(id_material, user);
  }

  async softDelete(id: string, user: any) {
    const module = 'MaterialGeneticoService';
    const method = 'softDelete';
    this.logger.log('Removendo material genético (soft delete)', { module, method, id_material: id });

    await this.findOne(id, user);

    const data = await this.materialRepo.softDelete(id);

    this.logger.log('Material genético removido com sucesso (soft delete)', { module, method, id_material: id });
    return {
      message: 'Material genético removido com sucesso (soft delete)',
      data,
    };
  }

  async restore(id: string, user: any) {
    const module = 'MaterialGeneticoService';
    const method = 'restore';
    this.logger.log('Restaurando material genético', { module, method, id_material: id });

    const material = await this.materialRepo.findByIdSimple(id);

    if (!material) {
      throw new NotFoundException(`Material genético com ID ${id} não encontrado`);
    }

    await this.validarOwnership(user, material.idPropriedade);

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

  async findAllWithDeleted(user: any): Promise<any[]> {
    const module = 'MaterialGeneticoService';
    const method = 'findAllWithDeleted';
    this.logger.log('Buscando todos os materiais genéticos incluindo deletados', { module, method });

    const userId = await this.authHelper.getUserId(user);
    const propriedades = await this.authHelper.getUserPropriedades(userId);
    return await this.materialRepo.findAllWithDeletedByPropriedades(propriedades);
  }
}
