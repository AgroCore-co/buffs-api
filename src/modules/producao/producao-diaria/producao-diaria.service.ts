import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateProducaoDiariaDto } from './dto/create-producao-diaria.dto';
import { UpdateProducaoDiariaDto } from './dto/update-producao-diaria.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { ProducaoDiariaRepository } from './repositories';

@Injectable()
export class ProducaoDiariaService implements ISoftDelete {
  constructor(
    private readonly repository: ProducaoDiariaRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateProducaoDiariaDto) {
    this.logger.log('Iniciando criação de registro de estoque de leite', {
      module: 'ProducaoDiariaService',
      method: 'create',
      usuarioId: dto.idUsuario,
      propriedadeId: dto.idPropriedade,
    });

    try {
      const data = await this.repository.criar(dto);

      this.logger.log('Registro de estoque de leite criado com sucesso', {
        module: 'ProducaoDiariaService',
        method: 'create',
        estoqueId: data.idEstoque,
        usuarioId: dto.idUsuario,
      });

      return {
        id_estoque: data.idEstoque,
        id_propriedade: data.idPropriedade,
        id_usuario: data.idUsuario,
        quantidade: data.quantidade,
        dt_registro: data.dtRegistro,
        observacao: data.observacao,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'create',
        usuarioId: dto.idUsuario,
      });
      throw new InternalServerErrorException(`Falha ao criar registro de estoque: ${error.message}`);
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todos os registros de estoque de leite com paginação', {
      module: 'ProducaoDiariaService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;

    try {
      const { registros, total } = await this.repository.listarTodos(page, limit);

      this.logger.log(`Busca de registros de estoque concluída - ${registros.length} registros encontrados (página ${page})`, {
        module: 'ProducaoDiariaService',
        method: 'findAll',
      });

      const formattedData = registros.map((estoque) => ({
        id_estoque: estoque.idEstoque,
        id_propriedade: estoque.idPropriedade,
        id_usuario: estoque.idUsuario,
        quantidade: estoque.quantidade,
        dt_registro: estoque.dtRegistro,
        observacao: estoque.observacao,
        created_at: estoque.createdAt,
        updated_at: estoque.updatedAt,
        deleted_at: estoque.deletedAt,
      }));

      return createPaginatedResponse(formattedData, total, page, limit);
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar estoque de leite: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de estoque por propriedade', {
      module: 'ProducaoDiariaService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;

    try {
      const { registros, total } = await this.repository.listarPorPropriedade(id_propriedade, page, limit);

      this.logger.log(`Busca concluída - ${registros.length} registros encontrados (página ${page})`, {
        module: 'ProducaoDiariaService',
        method: 'findByPropriedade',
      });

      const formattedData = registros.map((estoque) => ({
        id_estoque: estoque.idEstoque,
        id_propriedade: estoque.idPropriedade,
        id_usuario: estoque.idUsuario,
        quantidade: estoque.quantidade,
        dt_registro: estoque.dtRegistro,
        observacao: estoque.observacao,
        created_at: estoque.createdAt,
        updated_at: estoque.updatedAt,
        deleted_at: estoque.deletedAt,
      }));

      return createPaginatedResponse(formattedData, total, page, limit);
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar estoque da propriedade: ${error.message}`);
    }
  }

  async findOne(id_estoque: string) {
    this.logger.log('Iniciando busca de registro de estoque por ID', {
      module: 'ProducaoDiariaService',
      method: 'findOne',
      estoqueId: id_estoque,
    });

    try {
      const data = await this.repository.buscarPorId(id_estoque);

      if (!data) {
        this.logger.warn('Registro de estoque não encontrado', {
          module: 'ProducaoDiariaService',
          method: 'findOne',
          estoqueId: id_estoque,
        });
        throw new NotFoundException(`Registro de estoque com ID ${id_estoque} não encontrado.`);
      }

      this.logger.log('Registro de estoque encontrado com sucesso', {
        module: 'ProducaoDiariaService',
        method: 'findOne',
        estoqueId: id_estoque,
      });

      return {
        id_estoque: data.idEstoque,
        id_propriedade: data.idPropriedade,
        id_usuario: data.idUsuario,
        quantidade: data.quantidade,
        dt_registro: data.dtRegistro,
        observacao: data.observacao,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'findOne',
        estoqueId: id_estoque,
      });
      throw new InternalServerErrorException(`Falha ao buscar registro de estoque: ${error.message}`);
    }
  }

  async update(id_estoque: string, dto: UpdateProducaoDiariaDto) {
    this.logger.log('Iniciando atualização de registro de estoque', {
      module: 'ProducaoDiariaService',
      method: 'update',
      estoqueId: id_estoque,
    });

    await this.findOne(id_estoque);

    try {
      const data = await this.repository.atualizar(id_estoque, dto);

      if (!data) {
        throw new NotFoundException(`Registro de estoque com ID ${id_estoque} não encontrado.`);
      }

      this.logger.log('Registro de estoque atualizado com sucesso', {
        module: 'ProducaoDiariaService',
        method: 'update',
        estoqueId: id_estoque,
      });

      return {
        id_estoque: data.idEstoque,
        id_propriedade: data.idPropriedade,
        id_usuario: data.idUsuario,
        quantidade: data.quantidade,
        dt_registro: data.dtRegistro,
        observacao: data.observacao,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'update',
        estoqueId: id_estoque,
      });
      throw new InternalServerErrorException(`Falha ao atualizar registro de estoque: ${error.message}`);
    }
  }

  async remove(id_estoque: string) {
    return this.softDelete(id_estoque);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de registro de estoque (soft delete)', {
      module: 'ProducaoDiariaService',
      method: 'softDelete',
      estoqueId: id,
    });

    await this.findOne(id);

    try {
      const data = await this.repository.softDelete(id);

      if (!data) {
        throw new NotFoundException(`Registro de estoque com ID ${id} não encontrado.`);
      }

      this.logger.log('Registro de estoque removido com sucesso (soft delete)', {
        module: 'ProducaoDiariaService',
        method: 'softDelete',
        estoqueId: id,
      });

      return {
        message: 'Registro removido com sucesso (soft delete)',
        data: {
          id_estoque: data.idEstoque,
          id_propriedade: data.idPropriedade,
          id_usuario: data.idUsuario,
          quantidade: data.quantidade,
          dt_registro: data.dtRegistro,
          observacao: data.observacao,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'softDelete',
        estoqueId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover registro de estoque: ${error.message}`);
    }
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de registro de estoque', {
      module: 'ProducaoDiariaService',
      method: 'restore',
      estoqueId: id,
    });

    try {
      const estoqueExistente = await this.repository.buscarPorId(id);

      if (!estoqueExistente) {
        throw new NotFoundException(`Registro de estoque com ID ${id} não encontrado`);
      }

      if (!estoqueExistente.deletedAt) {
        throw new BadRequestException('Este registro não está removido');
      }

      const data = await this.repository.restaurar(id);

      if (!data) {
        throw new InternalServerErrorException('Falha ao restaurar registro de estoque');
      }

      this.logger.log('Registro de estoque restaurado com sucesso', {
        module: 'ProducaoDiariaService',
        method: 'restore',
        estoqueId: id,
      });

      return {
        message: 'Registro restaurado com sucesso',
        data: {
          id_estoque: data.idEstoque,
          id_propriedade: data.idPropriedade,
          id_usuario: data.idUsuario,
          quantidade: data.quantidade,
          dt_registro: data.dtRegistro,
          observacao: data.observacao,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'restore',
        estoqueId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar registro de estoque: ${error.message}`);
    }
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todos os registros de estoque incluindo deletados', {
      module: 'ProducaoDiariaService',
      method: 'findAllWithDeleted',
    });

    try {
      const data = await this.repository.listarComDeletados();

      return data.map((estoque) => ({
        id_estoque: estoque.idEstoque,
        id_propriedade: estoque.idPropriedade,
        id_usuario: estoque.idUsuario,
        quantidade: estoque.quantidade,
        dt_registro: estoque.dtRegistro,
        observacao: estoque.observacao,
        created_at: estoque.createdAt,
        updated_at: estoque.updatedAt,
        deleted_at: estoque.deletedAt,
      }));
    } catch (error) {
      this.logger.logError(error, {
        module: 'ProducaoDiariaService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar registros de estoque (incluindo deletados)');
    }
  }
}
