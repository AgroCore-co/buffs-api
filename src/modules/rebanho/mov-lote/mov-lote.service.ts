import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { MovLoteRepositoryDrizzle } from './repositories/mov-lote.repository.drizzle';
import { AuthHelperService } from '../../../core/services/auth-helper.service';

@Injectable()
export class MovLoteService {
  constructor(
    private readonly movLoteRepository: MovLoteRepositoryDrizzle,
    private readonly authHelper: AuthHelperService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Valida apenas se as referências (lotes, grupo) existem no banco.
   */
  private async validatePropriedadeAccess(userId: string, idPropriedade?: string | null): Promise<void> {
    if (!idPropriedade) {
      throw new NotFoundException('Movimentação sem propriedade vinculada.');
    }

    await this.authHelper.validatePropriedadeAccess(userId, idPropriedade);
  }

  private async validateReferences(
    dto: CreateMovLoteDto | UpdateMovLoteDto,
    userId: string,
    contexto?: { idPropriedade?: string | null; idLoteAnterior?: string | null },
  ): Promise<void> {
    const idPropriedade = dto.idPropriedade ?? contexto?.idPropriedade ?? null;
    await this.validatePropriedadeAccess(userId, idPropriedade);

    const idLoteAnteriorComparacao = dto.idLoteAnterior ?? contexto?.idLoteAnterior ?? undefined;
    if (dto.idLoteAtual && idLoteAnteriorComparacao && dto.idLoteAtual === idLoteAnteriorComparacao) {
      throw new BadRequestException('Lote de origem e destino não podem ser iguais.');
    }

    if (dto.idGrupo) {
      const grupo = await this.movLoteRepository.findGrupoById(dto.idGrupo);
      if (!grupo) {
        throw new NotFoundException(`Grupo com ID ${dto.idGrupo} não encontrado.`);
      }

      if (idPropriedade && grupo.idPropriedade !== idPropriedade) {
        throw new BadRequestException('Grupo informado não pertence à propriedade da movimentação.');
      }

      await this.validatePropriedadeAccess(userId, grupo.idPropriedade);
    }

    if (dto.idLoteAtual) {
      const loteAtual = await this.movLoteRepository.findLoteById(dto.idLoteAtual);
      if (!loteAtual) {
        throw new NotFoundException(`Lote atual com ID ${dto.idLoteAtual} não encontrado.`);
      }

      if (idPropriedade && loteAtual.idPropriedade !== idPropriedade) {
        throw new BadRequestException('Lote de destino não pertence à propriedade da movimentação.');
      }

      await this.validatePropriedadeAccess(userId, loteAtual.idPropriedade);
    }

    if (dto.idLoteAnterior) {
      const loteAnterior = await this.movLoteRepository.findLoteById(dto.idLoteAnterior);
      if (!loteAnterior) {
        throw new NotFoundException(`Lote anterior com ID ${dto.idLoteAnterior} não encontrado.`);
      }

      if (idPropriedade && loteAnterior.idPropriedade !== idPropriedade) {
        throw new BadRequestException('Lote de origem não pertence à propriedade da movimentação.');
      }

      await this.validatePropriedadeAccess(userId, loteAnterior.idPropriedade);
    }
  }

  private async findOneWithOwnership(id: string, userId: string) {
    const movimentacao = await this.movLoteRepository.findById(id);

    if (!movimentacao) {
      throw new NotFoundException(`Movimentação com ID ${id} não encontrada.`);
    }

    await this.validatePropriedadeAccess(userId, movimentacao.idPropriedade);
    return movimentacao;
  }

  async create(createDto: CreateMovLoteDto, user: any) {
    const { idGrupo, idLoteAtual, dtEntrada } = createDto;
    let { idLoteAnterior } = createDto;
    const userId = await this.authHelper.getUserId(user);

    this.logger.log(`[INICIO] Movimentacao fisica iniciada - Grupo: ${idGrupo}, Lote destino: ${idLoteAtual}, Data entrada: ${dtEntrada}`);

    try {
      if (idLoteAnterior && idLoteAnterior === idLoteAtual) {
        this.logger.warn(`[VALIDACAO_FALHOU] Tentativa de mover grupo ${idGrupo} para o mesmo lote (${idLoteAtual})`);
        throw new BadRequestException('Lote de origem e destino não podem ser os mesmos.');
      }

      this.logger.debug(`[VALIDACAO] Validando referencias - Grupo: ${idGrupo}, Lote destino: ${idLoteAtual}`);
      await this.validateReferences(createDto, userId);
      this.logger.debug(`[VALIDACAO_OK] Referencias validadas com sucesso`);

      // **PASSO 1: BUSCAR E FINALIZAR REGISTRO ANTERIOR**
      this.logger.debug(`[BUSCA_REGISTRO] Procurando registro ativo atual para o grupo ${idGrupo}`);

      const registroAtual = await this.movLoteRepository.findRegistroAtual(idGrupo);

      const loteAnterior = null;

      if (registroAtual) {
        this.logger.log(`[REGISTRO_ENCONTRADO] Grupo ${idGrupo} atualmente no lote ${registroAtual.idLoteAtual} desde ${registroAtual.dtEntrada}`);

        if (new Date(dtEntrada) < new Date(registroAtual.dtEntrada)) {
          this.logger.warn(`[DATA_INVALIDA] Data de entrada (${dtEntrada}) anterior ao registro atual (${registroAtual.dtEntrada})`);
          throw new BadRequestException('A data de entrada não pode ser anterior à última movimentação do grupo.');
        }

        const diasPermanencia = Math.ceil((new Date(dtEntrada).getTime() - new Date(registroAtual.dtEntrada).getTime()) / (1000 * 60 * 60 * 24));
        this.logger.log(`[PERMANENCIA] Grupo ${idGrupo} permaneceu ${diasPermanencia} dias no lote ${registroAtual.idLoteAtual}`);

        this.logger.debug(`[FINALIZANDO_REGISTRO] Fechando registro ${registroAtual.idMovimento} com data de saida: ${dtEntrada}`);

        await this.movLoteRepository.update(registroAtual.idMovimento, { dtSaida: dtEntrada });

        this.logger.log(`[REGISTRO_FECHADO] Registro ${registroAtual.idMovimento} finalizado com sucesso`);

        if (!idLoteAnterior && registroAtual.idLoteAtual) {
          idLoteAnterior = registroAtual.idLoteAtual;
          this.logger.debug(`[AUTO_DETECCAO] Lote anterior detectado automaticamente: ${idLoteAnterior}`);
        }

        if (idLoteAnterior && idLoteAnterior === idLoteAtual) {
          throw new BadRequestException('Grupo já se encontra no lote informado como destino.');
        }
      } else {
        this.logger.log(`[PRIMEIRA_MOVIMENTACAO] Esta e a primeira movimentacao registrada para o grupo ${idGrupo}`);
      }

      // **PASSO 2: CRIAR NOVO REGISTRO DE ENTRADA**
      const dtoToInsert = {
        idGrupo,
        idLoteAnterior,
        idLoteAtual,
        idPropriedade: createDto.idPropriedade,
        dtEntrada,
      };

      this.logger.debug(`[CRIANDO_REGISTRO] Inserindo novo registro de movimentacao`, { dtoToInsert });

      const novoRegistro = await this.movLoteRepository.create(dtoToInsert);

      this.logger.log(`[SUCESSO] Movimentacao registrada com sucesso - ID: ${novoRegistro.idMovimento}`);
      this.logger.log(`[DETALHES_SUCESSO] Grupo ID: ${idGrupo} movido para lote ID: ${idLoteAtual}`);
      this.logger.log(`[FINALIZACAO] Operacao de movimentacao fisica concluida - Grupo: ${idGrupo}, Novo lote: ${idLoteAtual}`);

      return {
        message: `Grupo movido com sucesso para o novo lote.`,
        movimentacao: {
          id: novoRegistro.idMovimento,
          id_grupo: novoRegistro.idGrupo,
          id_lote_anterior: novoRegistro.idLoteAnterior,
          id_lote_atual: novoRegistro.idLoteAtual,
          dt_entrada: novoRegistro.dtEntrada,
          dt_saida: novoRegistro.dtSaida || null,
          dias_lote_anterior: registroAtual
            ? Math.ceil((new Date(dtEntrada).getTime() - new Date(registroAtual.dtEntrada).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] Falha na movimentacao fisica - Grupo: ${idGrupo}, Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(user: any, paginationDto: PaginationDto = {}) {
    const userId = await this.authHelper.getUserId(user);
    const propriedadesUsuario = await this.authHelper.getUserPropriedades(userId);
    const { page = 1, limit = 100 } = paginationDto;

    return await this.movLoteRepository.findByPropriedades(propriedadesUsuario, page, limit);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}, user: any): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de movimentações por propriedade', {
      module: 'MovLoteService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const userId = await this.authHelper.getUserId(user);
    await this.validatePropriedadeAccess(userId, id_propriedade);

    const { page = 1, limit = 10 } = paginationDto;

    const { registros, total } = await this.movLoteRepository.findByPropriedade(id_propriedade, page, limit);

    this.logger.log(`Busca concluída - ${registros.length} movimentações encontradas (página ${page})`, {
      module: 'MovLoteService',
      method: 'findByPropriedade',
    });

    return createPaginatedResponse(registros, total, page, limit);
  }

  async findOne(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    return this.findOneWithOwnership(id, userId);
  }

  async update(id: string, updateDto: UpdateMovLoteDto, user: any) {
    const userId = await this.authHelper.getUserId(user);
    const atual = await this.findOneWithOwnership(id, userId);

    if (updateDto.idPropriedade && updateDto.idPropriedade !== atual.idPropriedade) {
      throw new BadRequestException('Não é permitido alterar a propriedade de uma movimentação existente.');
    }

    await this.validateReferences(updateDto, userId, {
      idPropriedade: atual.idPropriedade,
      idLoteAnterior: atual.idLoteAnterior,
    });

    return await this.movLoteRepository.update(id, updateDto);
  }

  async remove(id: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    await this.findOneWithOwnership(id, userId);
    await this.movLoteRepository.remove(id);
    return;
  }

  async findHistoricoByGrupo(id_grupo: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    const grupo = await this.movLoteRepository.findGrupoById(id_grupo);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id_grupo} não encontrado.`);
    }

    await this.validatePropriedadeAccess(userId, grupo.idPropriedade);

    const movimentacoes = await this.movLoteRepository.findHistoricoByGrupo(id_grupo);

    return {
      grupo_id: id_grupo,
      total_movimentacoes: movimentacoes.length,
      historico: movimentacoes.map((mov) => ({
        id_movimento: mov.idMovimento,
        id_lote_anterior: mov.idLoteAnterior,
        id_lote_atual: mov.idLoteAtual,
        dt_entrada: mov.dtEntrada,
        dt_saida: mov.dtSaida,
        dias_permanencia: mov.dtSaida
          ? Math.ceil((new Date(mov.dtSaida).getTime() - new Date(mov.dtEntrada).getTime()) / (1000 * 60 * 60 * 24))
          : Math.ceil((new Date().getTime() - new Date(mov.dtEntrada).getTime()) / (1000 * 60 * 60 * 24)),
        status: mov.dtSaida ? 'Finalizado' : 'Atual',
      })),
    };
  }

  async findStatusAtual(id_grupo: string, user: any) {
    const userId = await this.authHelper.getUserId(user);
    const grupo = await this.movLoteRepository.findGrupoById(id_grupo);

    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${id_grupo} não encontrado.`);
    }

    await this.validatePropriedadeAccess(userId, grupo.idPropriedade);

    const movimento = await this.movLoteRepository.findStatusAtual(id_grupo);

    if (!movimento) {
      throw new NotFoundException(`Grupo ${id_grupo} não possui movimentações registradas.`);
    }

    const diasNoLocal = Math.ceil((new Date().getTime() - new Date(movimento.dtEntrada).getTime()) / (1000 * 60 * 60 * 24));

    return {
      grupo_id: id_grupo,
      localizacao_atual: {
        id_lote: movimento.idLoteAtual,
        desde: movimento.dtEntrada,
        dias_no_local: diasNoLocal,
      },
    };
  }
}
