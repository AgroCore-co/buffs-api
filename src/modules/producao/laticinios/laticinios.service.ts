import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateLaticiniosDto } from './dto/create-laticinios.dto';
import { UpdateLaticiniosDto } from './dto/update-laticinios.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { LaticiniosRepositoryDrizzle } from './repositories';

@Injectable()
export class LaticiniosService implements ISoftDelete {
  constructor(
    private readonly repository: LaticiniosRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly authHelper: AuthHelperService,
  ) {}

  async create(dto: CreateLaticiniosDto, user: any) {
    const idUsuario = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(idUsuario, dto.idPropriedade);

    this.logger.log('Iniciando criação de indústria', {
      module: 'LaticiniosService',
      method: 'create',
      nome: dto.nome,
    });

    try {
      const data = await this.repository.criar(dto);

      this.logger.log('Indústria criada com sucesso', {
        module: 'LaticiniosService',
        method: 'create',
        industriaId: data.idIndustria,
        nome: dto.nome,
      });

      return {
        id_industria: data.idIndustria,
        nome: data.nome,
        representante: data.representante,
        contato: data.contato,
        observacao: data.observacao,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'create',
        nome: dto.nome,
      });
      throw new InternalServerErrorException(`Falha ao criar indústria: ${error.message}`);
    }
  }

  async findAll(user: any) {
    const idUsuario = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(idUsuario);

    this.logger.log('Iniciando busca de todas as indústrias', {
      module: 'LaticiniosService',
      method: 'findAll',
    });

    try {
      const data = await this.repository.listarTodasPorPropriedades(propriedadesUsuario);

      this.logger.log(`Busca de indústrias concluída - ${data.length} indústrias encontradas`, {
        module: 'LaticiniosService',
        method: 'findAll',
      });

      return data.map((industria) => ({
        id_industria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        id_propriedade: industria.idPropriedade,
        created_at: industria.createdAt,
        updated_at: industria.updatedAt,
        deleted_at: industria.deletedAt,
      }));
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'findAll',
      });
      throw new InternalServerErrorException(`Falha ao buscar indústrias: ${error.message}`);
    }
  }

  async findByPropriedade(id_propriedade: string, user: any) {
    const idUsuario = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(idUsuario, id_propriedade);

    this.logger.log('Iniciando busca de indústrias por propriedade', {
      module: 'LaticiniosService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    try {
      const data = await this.repository.listarPorPropriedade(id_propriedade);

      this.logger.log(`Busca concluída - ${data.length} indústrias encontradas para a propriedade`, {
        module: 'LaticiniosService',
        method: 'findByPropriedade',
        propriedadeId: id_propriedade,
      });

      return data.map((industria) => ({
        id_industria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        id_propriedade: industria.idPropriedade,
        created_at: industria.createdAt,
        updated_at: industria.updatedAt,
        deleted_at: industria.deletedAt,
      }));
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'findByPropriedade',
        propriedadeId: id_propriedade,
      });
      throw new InternalServerErrorException(`Falha ao buscar indústrias da propriedade: ${error.message}`);
    }
  }

  async findOne(id_industria: string, user: any) {
    this.logger.log('Iniciando busca de indústria por ID', {
      module: 'LaticiniosService',
      method: 'findOne',
      industriaId: id_industria,
    });

    try {
      const data = await this.repository.buscarPorId(id_industria);

      if (!data) {
        this.logger.warn('Indústria não encontrada', {
          module: 'LaticiniosService',
          method: 'findOne',
          industriaId: id_industria,
        });
        throw new NotFoundException(`Indústria com ID ${id_industria} não encontrada.`);
      }

      const idUsuario = await this.authHelper.getUserId(user);
      if (data.idPropriedade) {
        await this.authHelper.validatePropriedadeAccess(idUsuario, data.idPropriedade);
      }

      this.logger.log('Indústria encontrada com sucesso', {
        module: 'LaticiniosService',
        method: 'findOne',
        industriaId: id_industria,
      });

      return {
        id_industria: data.idIndustria,
        nome: data.nome,
        representante: data.representante,
        contato: data.contato,
        observacao: data.observacao,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'findOne',
        industriaId: id_industria,
      });
      throw new InternalServerErrorException(`Falha ao buscar indústria: ${error.message}`);
    }
  }

  async update(id_industria: string, dto: UpdateLaticiniosDto, user: any) {
    this.logger.log('Iniciando atualização de indústria', {
      module: 'LaticiniosService',
      method: 'update',
      industriaId: id_industria,
    });

    await this.findOne(id_industria, user);

    try {
      const data = await this.repository.atualizar(id_industria, dto);

      if (!data) {
        throw new NotFoundException(`Indústria com ID ${id_industria} não encontrada.`);
      }

      this.logger.log('Indústria atualizada com sucesso', {
        module: 'LaticiniosService',
        method: 'update',
        industriaId: id_industria,
      });

      return {
        id_industria: data.idIndustria,
        nome: data.nome,
        representante: data.representante,
        contato: data.contato,
        observacao: data.observacao,
        id_propriedade: data.idPropriedade,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        deleted_at: data.deletedAt,
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'update',
        industriaId: id_industria,
      });
      throw new InternalServerErrorException(`Falha ao atualizar indústria: ${error.message}`);
    }
  }

  async remove(id_industria: string, user: any) {
    return this.softDelete(id_industria, user);
  }

  async softDelete(id: string, user?: any) {
    this.logger.log('Iniciando remoção de indústria (soft delete)', {
      module: 'LaticiniosService',
      method: 'softDelete',
      industriaId: id,
    });

    await this.findOne(id, user);

    try {
      const data = await this.repository.softDelete(id);

      if (!data) {
        throw new NotFoundException(`Indústria com ID ${id} não encontrada.`);
      }

      this.logger.log('Indústria removida com sucesso (soft delete)', {
        module: 'LaticiniosService',
        method: 'softDelete',
        industriaId: id,
      });

      return {
        message: 'Indústria removida com sucesso (soft delete)',
        data: {
          id_industria: data.idIndustria,
          nome: data.nome,
          representante: data.representante,
          contato: data.contato,
          observacao: data.observacao,
          id_propriedade: data.idPropriedade,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'softDelete',
        industriaId: id,
      });
      throw new InternalServerErrorException(`Falha ao remover indústria: ${error.message}`);
    }
  }

  async restore(id: string, user?: any) {
    this.logger.log('Iniciando restauração de indústria', {
      module: 'LaticiniosService',
      method: 'restore',
      industriaId: id,
    });

    try {
      const idUsuario = await this.authHelper.getUserId(user);
      const industriaExistente = await this.repository.buscarPorIdComDeletados(id);

      if (!industriaExistente) {
        throw new NotFoundException(`Indústria com ID ${id} não encontrada`);
      }

      if (industriaExistente.idPropriedade) {
        await this.authHelper.validatePropriedadeAccess(idUsuario, industriaExistente.idPropriedade);
      }

      if (!industriaExistente.deletedAt) {
        throw new BadRequestException('Esta indústria não está removida');
      }

      const data = await this.repository.restaurar(id);

      if (!data) {
        throw new InternalServerErrorException('Falha ao restaurar indústria');
      }

      this.logger.log('Indústria restaurada com sucesso', {
        module: 'LaticiniosService',
        method: 'restore',
        industriaId: id,
      });

      return {
        message: 'Indústria restaurada com sucesso',
        data: {
          id_industria: data.idIndustria,
          nome: data.nome,
          representante: data.representante,
          contato: data.contato,
          observacao: data.observacao,
          id_propriedade: data.idPropriedade,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
          deleted_at: data.deletedAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'restore',
        industriaId: id,
      });
      throw new InternalServerErrorException(`Falha ao restaurar indústria: ${error.message}`);
    }
  }

  async findAllWithDeleted(user?: any): Promise<any[]> {
    this.logger.log('Buscando todas as indústrias incluindo deletadas', {
      module: 'LaticiniosService',
      method: 'findAllWithDeleted',
    });

    try {
      const idUsuario = await this.authHelper.getUserId(user);
      const propriedadesUsuario = await this.authHelper.getUserPropriedades(idUsuario);
      const data = await this.repository.listarComDeletadosPorPropriedades(propriedadesUsuario);

      return data.map((industria) => ({
        id_industria: industria.idIndustria,
        nome: industria.nome,
        representante: industria.representante,
        contato: industria.contato,
        observacao: industria.observacao,
        id_propriedade: industria.idPropriedade,
        created_at: industria.createdAt,
        updated_at: industria.updatedAt,
        deleted_at: industria.deletedAt,
      }));
    } catch (error) {
      this.logger.logError(error, {
        module: 'LaticiniosService',
        method: 'findAllWithDeleted',
      });
      throw new InternalServerErrorException('Erro ao buscar indústrias (incluindo deletadas)');
    }
  }
}
