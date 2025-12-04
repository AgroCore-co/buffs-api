import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq } from 'drizzle-orm';
import { endereco } from 'src/database/schema';
import { CreateEnderecoDto } from '../dto/create-endereco.dto';
import { UpdateEnderecoDto } from '../dto/update-endereco.dto';

/**
 * Repository Drizzle para operações de Endereço.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class EnderecoRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Cria um novo endereço
   */
  async criar(createEnderecoDto: CreateEnderecoDto) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const [novoEndereco] = await this.databaseService.db
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

      return novoEndereco;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'EnderecoRepositoryDrizzle',
        method: 'criar',
        dto: createEnderecoDto,
      });
      throw new InternalServerErrorException(`Erro ao criar endereço: ${error.message}`);
    }
  }

  /**
   * Busca todos os endereços
   */
  async buscarTodos() {
    try {
      return await this.databaseService.db.query.endereco.findMany({
        orderBy: (endereco, { desc }) => [desc(endereco.createdAt)],
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'EnderecoRepositoryDrizzle',
        method: 'buscarTodos',
      });
      throw new InternalServerErrorException(`Erro ao buscar endereços: ${error.message}`);
    }
  }

  /**
   * Busca um endereço por ID
   */
  async buscarPorId(id: string) {
    try {
      return await this.databaseService.db.query.endereco.findFirst({
        where: eq(endereco.idEndereco, id),
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'EnderecoRepositoryDrizzle',
        method: 'buscarPorId',
        id,
      });
      throw new InternalServerErrorException(`Erro ao buscar endereço: ${error.message}`);
    }
  }

  /**
   * Atualiza um endereço
   */
  async atualizar(id: string, updateEnderecoDto: UpdateEnderecoDto) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updateEnderecoDto.pais !== undefined) updateData.pais = updateEnderecoDto.pais;
      if (updateEnderecoDto.estado !== undefined) updateData.estado = updateEnderecoDto.estado;
      if (updateEnderecoDto.cidade !== undefined) updateData.cidade = updateEnderecoDto.cidade;
      if (updateEnderecoDto.bairro !== undefined) updateData.bairro = updateEnderecoDto.bairro;
      if (updateEnderecoDto.rua !== undefined) updateData.rua = updateEnderecoDto.rua;
      if (updateEnderecoDto.cep !== undefined) updateData.cep = updateEnderecoDto.cep;
      if (updateEnderecoDto.numero !== undefined) updateData.numero = updateEnderecoDto.numero;
      if (updateEnderecoDto.ponto_referencia !== undefined) updateData.pontoReferencia = updateEnderecoDto.ponto_referencia;

      const [enderecoAtualizado] = await this.databaseService.db.update(endereco).set(updateData).where(eq(endereco.idEndereco, id)).returning();

      return enderecoAtualizado;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'EnderecoRepositoryDrizzle',
        method: 'atualizar',
        id,
        dto: updateEnderecoDto,
      });
      throw new InternalServerErrorException(`Erro ao atualizar endereço: ${error.message}`);
    }
  }

  /**
   * Remove um endereço
   */
  async remover(id: string) {
    try {
      await this.databaseService.db.delete(endereco).where(eq(endereco.idEndereco, id));
    } catch (error) {
      this.logger.logError(error, {
        repository: 'EnderecoRepositoryDrizzle',
        method: 'remover',
        id,
      });
      throw new InternalServerErrorException(`Erro ao remover endereço: ${error.message}`);
    }
  }
}
