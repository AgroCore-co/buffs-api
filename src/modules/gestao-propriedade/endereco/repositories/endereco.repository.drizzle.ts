import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { endereco } from 'src/database/schema';
import { CreateEnderecoDto } from '../dto/create-endereco.dto';
import { UpdateEnderecoDto } from '../dto/update-endereco.dto';
import { eq } from 'drizzle-orm';

/**
 * Repository Drizzle para operações de Endereço.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class EnderecoRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Cria um novo endereço
   */
  async criar(createEnderecoDto: CreateEnderecoDto) {
    try {
      const [result] = await this.databaseService.db
        .insert(endereco)
        .values({
          pais: createEnderecoDto.pais,
          estado: createEnderecoDto.estado,
          cidade: createEnderecoDto.cidade,
          bairro: createEnderecoDto.bairro,
          rua: createEnderecoDto.rua,
          cep: createEnderecoDto.cep,
          numero: createEnderecoDto.numero,
          pontoReferencia: createEnderecoDto.ponto_referencia,
        })
        .returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(`[EnderecoRepository] Erro ao criar endereço: ${error.message}`);
    }
  }

  /**
   * Busca todos os endereços
   */
  async buscarTodos() {
    return await this.databaseService.db.select().from(endereco);
  }

  /**
   * Busca um endereço por ID
   */
  async buscarPorId(id: string) {
    const [result] = await this.databaseService.db.select().from(endereco).where(eq(endereco.idEndereco, id)).limit(1);
    return result || null;
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

    const [result] = await this.databaseService.db.update(endereco).set(updateData).where(eq(endereco.idEndereco, id)).returning();
    return result || null;
  }

  /**
   * Remove um endereço (hard delete)
   */
  async remover(id: string) {
    await this.databaseService.db.delete(endereco).where(eq(endereco.idEndereco, id));
    return true;
  }
}
