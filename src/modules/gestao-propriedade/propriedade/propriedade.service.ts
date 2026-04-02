import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreatePropriedadeDto } from './dto/create-propriedade.dto';
import { UpdatePropriedadeDto } from './dto/update-propriedade.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { PropriedadeRepositoryDrizzle } from './repositories';

@Injectable()
export class PropriedadeService {
  constructor(
    private readonly propriedadeRepo: PropriedadeRepositoryDrizzle,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  async create(createPropriedadeDto: CreatePropriedadeDto, user: any) {
    const idDono = await this.authHelper.getUserId(user);

    try {
      const novaPropriedade = await this.propriedadeRepo.criar(createPropriedadeDto, idDono);
      return formatDateFields(novaPropriedade);
    } catch (error) {
      // Verifica erro de chave estrangeira (endereço não existe)
      if (error.message?.includes('foreign key')) {
        throw new BadRequestException(`O endereço com id ${createPropriedadeDto.idEndereco} não foi encontrado.`);
      }
      this.logger.logError(error, { module: 'Propriedade', method: 'create' });
      throw new InternalServerErrorException('Falha ao criar a propriedade.');
    }
  }

  /**
   * Lista todas as propriedades vinculadas ao usuário (como dono OU funcionário)
   */
  async findAll(user: any) {
    const userId = await this.authHelper.getUserId(user);
    this.logger.log(`[INICIO] Buscando propriedades do usuário ${userId}`);

    try {
      // 1. Busca propriedades onde o usuário é DONO e FUNCIONÁRIO em paralelo
      const [propriedadesComoDono, propriedadesComoFuncionario] = await Promise.all([
        this.propriedadeRepo.buscarPropriedadesComoDono(userId),
        this.propriedadeRepo.buscarPropriedadesComoFuncionario(userId),
      ]);

      // 3. Combina as propriedades (removendo duplicatas)
      const propriedadesFuncionario = propriedadesComoFuncionario?.map((item: any) => item.propriedade) || [];
      const todasPropriedades = [...(propriedadesComoDono || []), ...propriedadesFuncionario];

      // Remove duplicatas pelo idPropriedade
      const propriedadesUnicas = Array.from(new Map(todasPropriedades.map((p) => [p.idPropriedade, p])).values());

      this.logger.log(`[SUCESSO] ${propriedadesUnicas.length} propriedades encontradas para o usuário ${userId}`);

      const formattedPropriedades = formatDateFieldsArray(propriedadesUnicas);
      return {
        message: 'Propriedades recuperadas com sucesso',
        total: formattedPropriedades.length,
        propriedades: formattedPropriedades,
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca uma propriedade específica, garantindo que ela pertença ao usuário logado.
   */
  async findOne(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.authHelper.validatePropriedadeAccess(userId, id);

    const propriedade = await this.propriedadeRepo.buscarPorIdInterno(id);

    if (!propriedade) {
      throw new NotFoundException(`Propriedade com ID ${id} não encontrada.`);
    }

    return formatDateFields(propriedade);
  }

  /**
   * Atualiza uma propriedade, verificando a posse antes de realizar a operação.
   * Apenas donos podem atualizar propriedades.
   */
  async update(id: string, updatePropriedadeDto: UpdatePropriedadeDto, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Verifica se o usuário é DONO da propriedade (apenas donos podem atualizar)
    const propriedade = await this.propriedadeRepo.buscarPropriedadeComoDono(id, userId);

    if (!propriedade) {
      throw new NotFoundException(`Propriedade com ID ${id} não encontrada ou você não tem permissão para atualizá-la.`);
    }

    const propriedadeAtualizada = await this.propriedadeRepo.atualizar(id, updatePropriedadeDto);
    return formatDateFields(propriedadeAtualizada);
  }

  /**
   * Remove uma propriedade, verificando a posse antes de deletar.
   * Apenas donos podem remover propriedades.
   */
  async remove(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);

    // Verifica se o usuário é DONO da propriedade (apenas donos podem deletar)
    const propriedade = await this.propriedadeRepo.buscarPropriedadeComoDono(id, userId);

    if (!propriedade) {
      throw new NotFoundException(`Propriedade com ID ${id} não encontrada ou você não tem permissão para removê-la.`);
    }

    await this.propriedadeRepo.remover(id);

    // Retornar void é a prática padrão para DELETE, resultando em status 204 No Content.
    return;
  }
}
