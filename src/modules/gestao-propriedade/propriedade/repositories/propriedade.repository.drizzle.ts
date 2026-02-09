import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { eq, and, or, isNull, desc } from 'drizzle-orm';
import { propriedade, usuario, usuariopropriedade } from 'src/database/schema';
import { CreatePropriedadeDto } from '../dto/create-propriedade.dto';
import { UpdatePropriedadeDto } from '../dto/update-propriedade.dto';

/**
 * Repository Drizzle para operações de Propriedade.
 * Isola queries do Drizzle da lógica de negócio.
 */
@Injectable()
export class PropriedadeRepositoryDrizzle {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Busca usuário por email
   */
  async buscarUsuarioPorEmail(email: string) {
    try {
      return await this.databaseService.db.query.usuario.findFirst({
        where: eq(usuario.email, email),
        columns: {
          idUsuario: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'buscarUsuarioPorEmail',
        email,
      });
      throw new InternalServerErrorException(`Erro ao buscar usuário: ${error.message}`);
    }
  }

  /**
   * Cria uma nova propriedade
   */
  async criar(createPropriedadeDto: CreatePropriedadeDto, idDono: string) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const [novaPropriedade] = await this.databaseService.db
        .insert(propriedade)
        .values({
          nome: createPropriedadeDto.nome,
          cnpj: createPropriedadeDto.cnpj,
          idEndereco: createPropriedadeDto.idEndereco,
          pAbcb: createPropriedadeDto.p_abcb,
          tipoManejo: createPropriedadeDto.tipoManejo,
          idDono,
        })
        .returning();

      return novaPropriedade;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'criar',
        dto: createPropriedadeDto,
        idDono,
      });
      throw new InternalServerErrorException(`Erro ao criar propriedade: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é dono
   */
  async buscarPropriedadesComoDono(userId: string) {
    try {
      return await this.databaseService.db.query.propriedade.findMany({
        where: and(eq(propriedade.idDono, userId), isNull(propriedade.deletedAt)),
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadesComoDono',
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedades como dono: ${error.message}`);
    }
  }

  /**
   * Busca propriedades onde o usuário é funcionário
   */
  async buscarPropriedadesComoFuncionario(userId: string) {
    try {
      return await this.databaseService.db.query.usuariopropriedade.findMany({
        where: eq(usuariopropriedade.idUsuario, userId),
        with: {
          propriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadesComoFuncionario',
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedades como funcionário: ${error.message}`);
    }
  }

  async findById(id: string) {
    try {
      return await this.databaseService.db.query.propriedade.findFirst({
        where: and(eq(propriedade.idPropriedade, id), isNull(propriedade.deletedAt)),
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'findById',
        id,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedade por ID: ${error.message}`);
    }
  }

  /**
   * Busca uma propriedade por ID onde o usuário é dono
   */
  async buscarPropriedadeComoDono(idPropriedade: string, userId: string) {
    try {
      return await this.databaseService.db.query.propriedade.findFirst({
        where: and(eq(propriedade.idPropriedade, idPropriedade), eq(propriedade.idDono, userId), isNull(propriedade.deletedAt)),
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'buscarPropriedadeComoDono',
        idPropriedade,
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar propriedade como dono: ${error.message}`);
    }
  }

  /**
   * Busca vínculo de funcionário com propriedade
   */
  async buscarVinculoFuncionario(idPropriedade: string, userId: string) {
    try {
      return await this.databaseService.db.query.usuariopropriedade.findFirst({
        where: and(eq(usuariopropriedade.idPropriedade, idPropriedade), eq(usuariopropriedade.idUsuario, userId)),
        with: {
          propriedade: true,
        },
      });
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'buscarVinculoFuncionario',
        idPropriedade,
        userId,
      });
      throw new InternalServerErrorException(`Erro ao buscar vínculo de funcionário: ${error.message}`);
    }
  }

  /**
   * Atualiza uma propriedade
   */
  async atualizar(id: string, updatePropriedadeDto: UpdatePropriedadeDto) {
    try {
      // Mapear snake_case (DTO) para camelCase (schema)
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updatePropriedadeDto.nome !== undefined) updateData.nome = updatePropriedadeDto.nome;
      if (updatePropriedadeDto.cnpj !== undefined) updateData.cnpj = updatePropriedadeDto.cnpj;
      if (updatePropriedadeDto.idEndereco !== undefined) updateData.idEndereco = updatePropriedadeDto.idEndereco;
      if (updatePropriedadeDto.p_abcb !== undefined) updateData.pAbcb = updatePropriedadeDto.p_abcb;
      if (updatePropriedadeDto.tipoManejo !== undefined) updateData.tipoManejo = updatePropriedadeDto.tipoManejo;

      const [propriedadeAtualizada] = await this.databaseService.db
        .update(propriedade)
        .set(updateData)
        .where(eq(propriedade.idPropriedade, id))
        .returning();

      return propriedadeAtualizada;
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'atualizar',
        id,
        dto: updatePropriedadeDto,
      });
      throw new InternalServerErrorException(`Erro ao atualizar propriedade: ${error.message}`);
    }
  }

  /**
   * Remove uma propriedade
   */
  async remover(id: string) {
    try {
      await this.databaseService.db.delete(propriedade).where(eq(propriedade.idPropriedade, id));
    } catch (error) {
      this.logger.logError(error, {
        repository: 'PropriedadeRepositoryDrizzle',
        method: 'remover',
        id,
      });
      throw new InternalServerErrorException(`Erro ao remover propriedade: ${error.message}`);
    }
  }
}
