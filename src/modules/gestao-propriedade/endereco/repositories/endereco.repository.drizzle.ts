import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { endereco, propriedade } from 'src/database/schema';
import { CreateEnderecoDto } from '../dto/create-endereco.dto';
import { UpdateEnderecoDto } from '../dto/update-endereco.dto';
import { eq, inArray, and, isNull } from 'drizzle-orm';

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
    return await this.databaseService.db.select().from(endereco).where(isNull(endereco.deletedAt));
  }

  /**
   * Busca enderecos vinculados a propriedades acessiveis
   */
  async buscarPorPropriedades(idsPropriedades: string[]) {
    if (idsPropriedades.length === 0) {
      return [];
    }

    const result = await this.databaseService.db
      .select()
      .from(endereco)
      .innerJoin(propriedade, eq(propriedade.idEndereco, endereco.idEndereco))
      .where(and(inArray(propriedade.idPropriedade, idsPropriedades), isNull(propriedade.deletedAt), isNull(endereco.deletedAt)));

    return result.map(({ endereco: enderecoData }) => enderecoData);
  }

  /**
   * Busca um endereço por ID
   */
  async buscarPorId(id: string) {
    const [result] = await this.databaseService.db
      .select()
      .from(endereco)
      .where(and(eq(endereco.idEndereco, id), isNull(endereco.deletedAt)))
      .limit(1);
    return result || null;
  }

  /**
   * Busca um endereco por ID, garantindo que pertença às propriedades acessiveis
   */
  async buscarPorIdComPropriedades(idEndereco: string, idsPropriedades: string[]) {
    if (idsPropriedades.length === 0) {
      return null;
    }

    const [result] = await this.databaseService.db
      .select()
      .from(endereco)
      .innerJoin(propriedade, eq(propriedade.idEndereco, endereco.idEndereco))
      .where(
        and(
          inArray(propriedade.idPropriedade, idsPropriedades),
          eq(endereco.idEndereco, idEndereco),
          isNull(propriedade.deletedAt),
          isNull(endereco.deletedAt),
        ),
      )
      .limit(1);

    return result?.endereco || null;
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
   * Remove um endereço (soft delete)
   */
  async remover(id: string) {
    await this.databaseService.db.update(endereco).set({ deletedAt: new Date().toISOString() }).where(eq(endereco.idEndereco, id));
    return true;
  }
}
