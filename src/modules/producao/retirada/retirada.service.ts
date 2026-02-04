import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateRetiradaDto } from './dto/create-retirada.dto';
import { UpdateRetiradaDto } from './dto/update-retirada.dto';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { ISoftDelete } from '../../../core/interfaces/soft-delete.interface';
import { RetiradaRepository } from './repositories';

@Injectable()
export class RetiradaService implements ISoftDelete {
  constructor(
    private readonly repository: RetiradaRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateRetiradaDto, id_funcionario: string) {
    this.logger.log('Iniciando criação de coleta', {
      module: 'RetiradaService',
      method: 'create',
      funcionarioId: id_funcionario,
      industriaId: dto.idIndustria,
    });

    try {
      const data = await this.repository.criar(dto, id_funcionario);

      this.logger.log('Coleta criada com sucesso', {
        module: 'RetiradaService',
        method: 'create',
        coletaId: data.idColeta,
        funcionarioId: id_funcionario,
      });

      return {
        id_coleta: data.idColeta,
        id_industria: data.idIndustria,
        resultado_teste: data.resultadoTeste,
        observacao: data.observacao,
        quantidade: data.quantidade,
        dt_coleta: data.dtColeta,
        id_funcionario: data.idFuncionario,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'create',
        funcionarioId: id_funcionario,
      });
      throw new InternalServerErrorException(`Falha ao criar coleta: ${error.message}`);
    }
  }

  async findAll(paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de todas as coletas com paginação', {
      module: 'RetiradaService',
      method: 'findAll',
    });

    const { page = 1, limit = 10 } = paginationDto;

    try {
      const { registros, total } = await this.repository.listarTodas(page, limit);

      this.logger.log(`Busca de coletas concluída - ${registros.length} coletas encontradas (página ${page})`, {
        module: 'ColetaService',
        method: 'findAll',
      });

      const formattedData = registros.map((coleta) => ({
        id_coleta: coleta.idColeta,
        id_industria: coleta.idIndustria,
        resultado_teste: coleta.resultadoTeste,
        observacao: coleta.observacao,
        quantidade: coleta.quantidade,
        dt_coleta: coleta.dtColeta,
        id_funcionario: coleta.idFuncionario,
        id_propriedade: coleta.idPropriedade,
        created_at: coleta.createdAt,
        updated_at: coleta.updatedAt,
        deleted_at: coleta.deletedAt,
      }));

      return createPaginatedResponse(formattedData, total, page, limit);
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar coletas: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<any> {
    this.logger.log('Iniciando busca de coletas por propriedade', {
      module: 'RetiradaService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;

    try {
      const { registros, total } = await this.repository.listarPorPropriedade(id_propriedade, page, limit);

      // Buscar estatísticas de TODA a propriedade usando Repository
      const { aprovadas: totalAprovadas, rejeitadas: totalRejeitadas } = await this.repository.obterEstatisticasPorPropriedade(id_propriedade);

      // Transformar dados para incluir nome_empresa
      const dataTransformed = registros.map((item: any) => ({
        id_coleta: item.coleta.idColeta,
        id_industria: item.coleta.idIndustria,
        resultado_teste: item.coleta.resultadoTeste,
        observacao: item.coleta.observacao,
        quantidade: item.coleta.quantidade,
        dt_coleta: item.coleta.dtColeta,
        id_funcionario: item.coleta.idFuncionario,
        id_propriedade: item.coleta.idPropriedade,
        created_at: item.coleta.createdAt,
        updated_at: item.coleta.updatedAt,
        deleted_at: item.coleta.deletedAt,
        nome_empresa: item.industria?.nome || 'Indústria não identificada',
      }));

      // Montar resposta com meta enriquecido
      const totalPages = Math.ceil(total / limit);
      const response = {
        data: dataTransformed,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          totalAprovadas,
          totalRejeitadas,
        },
      };

      this.logger.log(`Busca concluída - ${registros.length} coletas encontradas (página ${page})`, {
        module: 'RetiradaService',
        method: 'findByPropriedade',
        totalAprovadas,
        totalRejeitadas,
      });

      return response;
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findByPropriedade',
      });
      throw new InternalServerErrorException(`Falha ao buscar coletas da propriedade: ${error.message}`);
    }
  }

  async findOne(id_coleta: string) {
    this.logger.log('Iniciando busca de coleta por ID', {
      module: 'RetiradaService',
      method: 'findOne',
      coletaId: id_coleta,
    });

    try {
      const data = await this.repository.buscarPorId(id_coleta);

      if (!data) {
        this.logger.warn('Coleta não encontrada', {
          module: 'RetiradaService',
          method: 'findOne',
          coletaId: id_coleta,
        });
        throw new NotFoundException(`Coleta com ID ${id_coleta} não encontrada.`);
      }

      this.logger.log('Coleta encontrada com sucesso', {
        module: 'ColetaService',
        method: 'findOne',
        coletaId: id_coleta,
      });

      return {
        id_coleta: data.idColeta,
        id_industria: data.idIndustria,
        resultado_teste: data.resultadoTeste,
        observacao: data.observacao,
        quantidade: data.quantidade,
        dt_coleta: data.dtColeta,
        id_funcionario: data.idFuncionario,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findOne',
        coletaId: id_coleta,
      });
      throw new InternalServerErrorException(`Falha ao buscar coleta: ${error.message}`);
    }
  }

  async update(id_coleta: string, dto: UpdateRetiradaDto) {
    this.logger.log('Iniciando atualização de coleta', {
      module: 'ColetaService',
      method: 'update',
      coletaId: id_coleta,
    });

    await this.findOne(id_coleta);

    try {
      const data = await this.repository.atualizar(id_coleta, dto);

      if (!data) {
        throw new NotFoundException(`Coleta com ID ${id_coleta} não encontrada.`);
      }

      this.logger.log('Coleta atualizada com sucesso', {
        module: 'ColetaService',
        method: 'update',
        coletaId: id_coleta,
      });

      return {
        id_coleta: data.idColeta,
        id_industria: data.idIndustria,
        resultado_teste: data.resultadoTeste,
        observacao: data.observacao,
        quantidade: data.quantidade,
        dt_coleta: data.dtColeta,
        id_funcionario: data.idFuncionario,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'update',
        coletaId: id_coleta,
      });
      throw new InternalServerErrorException(`Falha ao atualizar coleta: ${error.message}`);
    }
  }

  async remove(id_coleta: string) {
    return this.softDelete(id_coleta);
  }

  async softDelete(id: string) {
    this.logger.log('Iniciando remoção de coleta (soft delete)', {
      module: 'ColetaService',
      method: 'softDelete',
      coletaId: id,
    });

    await this.findOne(id);

    try {
      const data = await this.repository.softDelete(id);

      if (!data) {
        throw new NotFoundException(`Coleta com ID ${id} não encontrada.`);
      }

      this.logger.log('Coleta removida com sucesso (soft delete)', {
        module: 'ColetaService',
        method: 'softDelete',
        coletaId: id,
      });

      return {
        message: 'Coleta removida com sucesso (soft delete)',
        data: {
          id_coleta: data.idColeta,
          id_industria: data.idIndustria,
          resultado_teste: data.resultadoTeste,
          observacao: data.observacao,
          quantidade: data.quantidade,
          dt_coleta: data.dtColeta,
          id_funcionario: data.idFuncionario,
          id_propriedade: data.idPropriedade,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'softDelete',
        coletaId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover coleta: ${error.message}`);
    }
  }

  async restore(id: string) {
    this.logger.log('Iniciando restauração de coleta', {
      module: 'ColetaService',
      method: 'restore',
      coletaId: id,
    });

    try {
      const coletaExistente = await this.repository.buscarPorId(id);

      if (!coletaExistente) {
        throw new NotFoundException(`Coleta com ID ${id} não encontrada`);
      }

      if (!coletaExistente.deletedAt) {
        throw new BadRequestException('Esta coleta não está removida');
      }

      const data = await this.repository.restaurar(id);

      if (!data) {
        throw new InternalServerErrorException('Falha ao restaurar coleta');
      }

      this.logger.log('Coleta restaurada com sucesso', {
        module: 'ColetaService',
        method: 'restore',
        coletaId: id,
      });

      return {
        message: 'Coleta restaurada com sucesso',
        data: {
          id_coleta: data.idColeta,
          id_industria: data.idIndustria,
          resultado_teste: data.resultadoTeste,
          observacao: data.observacao,
          quantidade: data.quantidade,
          dt_coleta: data.dtColeta,
          id_funcionario: data.idFuncionario,
          id_propriedade: data.idPropriedade,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'restore',
        coletaId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar coleta: ${error.message}`);
    }
  }

  async findAllWithDeleted(): Promise<any[]> {
    this.logger.log('Buscando todas as coletas incluindo deletadas', {
      module: 'ColetaService',
      method: 'findAllWithDeleted',
    });

    try {
      const data = await this.repository.listarComDeletados();

      return data.map((coleta) => ({
        id_coleta: coleta.idColeta,
        id_industria: coleta.idIndustria,
        resultado_teste: coleta.resultadoTeste,
        observacao: coleta.observacao,
        quantidade: coleta.quantidade,
        dt_coleta: coleta.dtColeta,
        id_funcionario: coleta.idFuncionario,
        id_propriedade: coleta.idPropriedade,
        created_at: coleta.createdAt,
        updated_at: coleta.updatedAt,
        deleted_at: coleta.deletedAt,
      }));
    } catch (error) {
      this.logger.logError(error, {
        module: 'ColetaService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar coletas (incluindo deletadas)');
    }
  }
}
