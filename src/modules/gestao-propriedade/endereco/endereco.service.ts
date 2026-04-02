import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { EnderecoRepositoryDrizzle } from './repositories';

@Injectable()
export class EnderecoService {
  constructor(
    private readonly enderecoRepo: EnderecoRepositoryDrizzle,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  async create(createEnderecoDto: CreateEnderecoDto) {
    try {
      const novoEndereco = await this.enderecoRepo.criar(createEnderecoDto);
      return formatDateFields(novoEndereco);
    } catch (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar endereço.');
    }
  }

  private async getPropriedadesUsuario(user: any): Promise<string[]> {
    const userId = await this.authHelper.getUserId(user);

    try {
      return await this.authHelper.getUserPropriedades(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return [];
      }
      throw error;
    }
  }

  async findAllByUser(user: any) {
    try {
      const propriedadesUsuario = await this.getPropriedadesUsuario(user);

      if (propriedadesUsuario.length === 0) {
        return [];
      }

      const enderecos = await this.enderecoRepo.buscarPorPropriedades(propriedadesUsuario);
      return formatDateFieldsArray(enderecos);
    } catch (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'findAllByUser' });
      throw new InternalServerErrorException('Falha ao listar endereços.');
    }
  }

  async findOne(id: string, user: any) {
    try {
      const propriedadesUsuario = await this.getPropriedadesUsuario(user);

      if (propriedadesUsuario.length === 0) {
        throw new NotFoundException('Endereço não encontrado.');
      }

      const endereco = await this.enderecoRepo.buscarPorIdComPropriedades(id, propriedadesUsuario);

      if (!endereco) {
        throw new NotFoundException('Endereço não encontrado.');
      }

      return formatDateFields(endereco);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.logError(error, { module: 'Endereco', method: 'findOne' });
      throw new InternalServerErrorException('Falha ao buscar endereço.');
    }
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto, user: any) {
    // Primeiro verifica se o endereço existe e pertence ao usuario
    await this.findOne(id, user);

    try {
      const enderecoAtualizado = await this.enderecoRepo.atualizar(id, updateEnderecoDto);
      return formatDateFields(enderecoAtualizado);
    } catch (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'update', id });
      throw new InternalServerErrorException('Falha ao atualizar endereço.');
    }
  }

  async remove(id: string, user: any) {
    // Primeiro verifica se o endereço existe e pertence ao usuario
    await this.findOne(id, user);

    try {
      await this.enderecoRepo.remover(id);
      return { message: 'Endereço deletado com sucesso.' };
    } catch (error) {
      this.logger.logError(error, { module: 'Endereco', method: 'remove', id });
      throw new InternalServerErrorException('Falha ao remover endereço.');
    }
  }
}
