import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMovLoteDto } from './dto/create-mov-lote.dto';
import { UpdateMovLoteDto } from './dto/update-mov-lote.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { PaginatedResponse } from '../../../core/dto/pagination.dto';
import { createPaginatedResponse } from '../../../core/utils/pagination.utils';
import { MovLoteRepositoryDrizzle } from './repositories/mov-lote.repository.drizzle';

@Injectable()
export class MovLoteService {
  constructor(
    private readonly movLoteRepository: MovLoteRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Valida apenas se as referências (lotes, grupo) existem no banco.
   */
  private async validateReferences(dto: CreateMovLoteDto | UpdateMovLoteDto): Promise<void> {
    if (dto.id_lote_atual && dto.id_lote_anterior && dto.id_lote_atual === dto.id_lote_anterior) {
      throw new BadRequestException('Lote de origem e destino não podem ser iguais.');
    }

    if (dto.id_grupo) {
      const grupoExists = await this.movLoteRepository.checkIfExists('grupo', 'id_grupo', dto.id_grupo);
      if (!grupoExists) throw new NotFoundException(`Grupo com ID ${dto.id_grupo} não encontrado.`);
    }

    if (dto.id_lote_atual) {
      const loteAtualExists = await this.movLoteRepository.checkIfExists('lote', 'id_lote', dto.id_lote_atual);
      if (!loteAtualExists) throw new NotFoundException(`Lote atual com ID ${dto.id_lote_atual} não encontrado.`);
    }

    if (dto.id_lote_anterior) {
      const loteAnteriorExists = await this.movLoteRepository.checkIfExists('lote', 'id_lote', dto.id_lote_anterior);
      if (!loteAnteriorExists) throw new NotFoundException(`Lote anterior com ID ${dto.id_lote_anterior} não encontrado.`);
    }
  }

  async create(createDto: CreateMovLoteDto, user: any) {
    const { id_grupo, id_lote_atual, dt_entrada } = createDto;
    let { id_lote_anterior } = createDto;

    this.logger.log(`[INICIO] Movimentacao fisica iniciada - Grupo: ${id_grupo}, Lote destino: ${id_lote_atual}, Data entrada: ${dt_entrada}`);

    try {
      if (id_lote_anterior && id_lote_anterior === id_lote_atual) {
        this.logger.warn(`[VALIDACAO_FALHOU] Tentativa de mover grupo ${id_grupo} para o mesmo lote (${id_lote_atual})`);
        throw new BadRequestException('Lote de origem e destino não podem ser os mesmos.');
      }

      this.logger.debug(`[VALIDACAO] Validando referencias - Grupo: ${id_grupo}, Lote destino: ${id_lote_atual}`);
      await this.validateReferences(createDto);
      this.logger.debug(`[VALIDACAO_OK] Referencias validadas com sucesso`);

      // **PASSO 1: BUSCAR E FINALIZAR REGISTRO ANTERIOR**
      this.logger.debug(`[BUSCA_REGISTRO] Procurando registro ativo atual para o grupo ${id_grupo}`);

      const registroAtual = await this.movLoteRepository.findRegistroAtual(id_grupo);

      let loteAnterior = null;

      if (registroAtual) {
        this.logger.log(`[REGISTRO_ENCONTRADO] Grupo ${id_grupo} atualmente no lote ${registroAtual.idLoteAtual} desde ${registroAtual.dtEntrada}`);

        if (new Date(dt_entrada) < new Date(registroAtual.dtEntrada)) {
          this.logger.warn(`[DATA_INVALIDA] Data de entrada (${dt_entrada}) anterior ao registro atual (${registroAtual.dtEntrada})`);
          throw new BadRequestException('A data de entrada não pode ser anterior à última movimentação do grupo.');
        }

        const diasPermanencia = Math.ceil((new Date(dt_entrada).getTime() - new Date(registroAtual.dtEntrada).getTime()) / (1000 * 60 * 60 * 24));
        this.logger.log(`[PERMANENCIA] Grupo ${id_grupo} permaneceu ${diasPermanencia} dias no lote ${registroAtual.idLoteAtual}`);

        this.logger.debug(`[FINALIZANDO_REGISTRO] Fechando registro ${registroAtual.idMovimento} com data de saida: ${dt_entrada}`);

        await this.movLoteRepository.update(registroAtual.idMovimento, { dt_saida: dt_entrada });

        this.logger.log(`[REGISTRO_FECHADO] Registro ${registroAtual.idMovimento} finalizado com sucesso`);

        if (!id_lote_anterior && registroAtual.idLoteAtual) {
          id_lote_anterior = registroAtual.idLoteAtual;
          this.logger.debug(`[AUTO_DETECCAO] Lote anterior detectado automaticamente: ${id_lote_anterior}`);
        }
      } else {
        this.logger.log(`[PRIMEIRA_MOVIMENTACAO] Esta e a primeira movimentacao registrada para o grupo ${id_grupo}`);
      }

      // **PASSO 2: CRIAR NOVO REGISTRO DE ENTRADA**
      const dtoToInsert = {
        id_grupo,
        id_lote_anterior,
        id_lote_atual,
        id_propriedade: createDto.id_propriedade,
        dt_entrada,
      };

      this.logger.debug(`[CRIANDO_REGISTRO] Inserindo novo registro de movimentacao`, { dtoToInsert });

      const novoRegistro = await this.movLoteRepository.create(dtoToInsert);

      this.logger.log(`[SUCESSO] Movimentacao registrada com sucesso - ID: ${novoRegistro.idMovimento}`);
      this.logger.log(`[DETALHES_SUCESSO] Grupo ID: ${id_grupo} movido para lote ID: ${id_lote_atual}`);
      this.logger.log(`[FINALIZACAO] Operacao de movimentacao fisica concluida - Grupo: ${id_grupo}, Novo lote: ${id_lote_atual}`);

      return {
        message: `Grupo movido com sucesso para o novo lote.`,
        movimentacao: {
          id: novoRegistro.idMovimento,
          id_grupo: novoRegistro.idGrupo,
          id_lote_anterior: novoRegistro.idLoteAnterior,
          id_lote_atual: novoRegistro.idLoteAtual,
          dt_entrada: novoRegistro.dtEntrada,
          dt_saida: novoRegistro.dtSaida,
          dias_lote_anterior: registroAtual
            ? Math.ceil((new Date(dt_entrada).getTime() - new Date(registroAtual.dtEntrada).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      };
    } catch (error) {
      this.logger.error(`[ERRO_GERAL] Falha na movimentacao fisica - Grupo: ${id_grupo}, Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll() {
    return await this.movLoteRepository.findByPropriedade('', 1, 100);
  }

  async findByPropriedade(id_propriedade: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    this.logger.log('Iniciando busca de movimentações por propriedade', {
      module: 'MovLoteService',
      method: 'findByPropriedade',
      propriedadeId: id_propriedade,
    });

    const { page = 1, limit = 10 } = paginationDto;

    const { registros, total } = await this.movLoteRepository.findByPropriedade(id_propriedade, page, limit);

    this.logger.log(`Busca concluída - ${registros.length} movimentações encontradas (página ${page})`, {
      module: 'MovLoteService',
      method: 'findByPropriedade',
    });

    return createPaginatedResponse(registros, total, page, limit);
  }

  async findOne(id: string) {
    const movimentacao = await this.movLoteRepository.findById(id);

    if (!movimentacao) {
      throw new NotFoundException(`Movimentação com ID ${id} não encontrada.`);
    }
    return movimentacao;
  }

  async update(id: string, updateDto: UpdateMovLoteDto) {
    await this.findOne(id);
    await this.validateReferences(updateDto);
    return await this.movLoteRepository.update(id, updateDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.movLoteRepository.remove(id);
    return;
  }

  async findHistoricoByGrupo(id_grupo: string) {
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

  async findStatusAtual(id_grupo: string) {
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
