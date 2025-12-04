import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { EnderecoRepositoryDrizzle } from './repositories';

@Injectable()
export class EnderecoService {
  constructor(
    private readonly enderecoRepo: EnderecoRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  async create(createEnderecoDto: CreateEnderecoDto) {
    const novoEndereco = await this.enderecoRepo.criar(createEnderecoDto);
    return formatDateFields(novoEndereco);
  }

  async findAll() {
    const enderecos = await this.enderecoRepo.buscarTodos();
    return formatDateFieldsArray(enderecos);
  }

  async findOne(id: string) {
    const endereco = await this.enderecoRepo.buscarPorId(id);

    if (!endereco) {
      throw new NotFoundException('Endereço não encontrado.');
    }

    return formatDateFields(endereco);
  }

  async update(id: string, updateEnderecoDto: UpdateEnderecoDto) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    const enderecoAtualizado = await this.enderecoRepo.atualizar(id, updateEnderecoDto);
    return formatDateFields(enderecoAtualizado);
  }

  async remove(id: string) {
    // Primeiro verifica se o endereço existe
    await this.findOne(id);

    await this.enderecoRepo.remover(id);
    return { message: 'Endereço deletado com sucesso.' };
  }
}
