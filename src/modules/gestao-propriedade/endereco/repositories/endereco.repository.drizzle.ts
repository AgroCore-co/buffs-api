import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { BaseRepository } from 'src/core/database/base.repository';
import { endereco } from 'src/database/schema';
import { CreateEnderecoDto } from '../dto/create-endereco.dto';
import { UpdateEnderecoDto } from '../dto/update-endereco.dto';

/**
 * Repository Drizzle para operações de Endereço.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class EnderecoRepositoryDrizzle extends BaseRepository<typeof endereco> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, endereco, 'idEndereco', 'EnderecoRepositoryDrizzle');
  }

  /**
   * Cria um novo endereço
   */
  async criar(createEnderecoDto: CreateEnderecoDto) {
    return this.create({
      pais: createEnderecoDto.pais,
      estado: createEnderecoDto.estado,
      cidade: createEnderecoDto.cidade,
      bairro: createEnderecoDto.bairro,
      rua: createEnderecoDto.rua,
      cep: createEnderecoDto.cep,
      numero: createEnderecoDto.numero,
      pontoReferencia: createEnderecoDto.ponto_referencia,
    });
  }

  /**
   * Busca todos os endereços
   */
  async buscarTodos() {
    return this.findAll();
  }

  /**
   * Busca um endereço por ID
   */
  async buscarPorId(id: string) {
    return this.findById(id);
  }

  /**
   * Atualiza um endereço
   */
  async atualizar(id: string, updateEnderecoDto: UpdateEnderecoDto) {
    const updateData: any = {};

    if (updateEnderecoDto.pais !== undefined) updateData.pais = updateEnderecoDto.pais;
    if (updateEnderecoDto.estado !== undefined) updateData.estado = updateEnderecoDto.estado;
    if (updateEnderecoDto.cidade !== undefined) updateData.cidade = updateEnderecoDto.cidade;
    if (updateEnderecoDto.bairro !== undefined) updateData.bairro = updateEnderecoDto.bairro;
    if (updateEnderecoDto.rua !== undefined) updateData.rua = updateEnderecoDto.rua;
    if (updateEnderecoDto.cep !== undefined) updateData.cep = updateEnderecoDto.cep;
    if (updateEnderecoDto.numero !== undefined) updateData.numero = updateEnderecoDto.numero;
    if (updateEnderecoDto.ponto_referencia !== undefined) updateData.pontoReferencia = updateEnderecoDto.ponto_referencia;

    return this.update(id, updateData);
  }

  /**
   * Remove um endereço (hard delete)
   */
  async remover(id: string) {
    return this.hardDelete(id);
  }
}
