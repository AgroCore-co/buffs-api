import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateVacinacaoDto } from './dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from './dto/update-vacinacao.dto';
import { formatDateFields, formatDateFieldsArray } from '../../../core/utils/date-formatter.utils';
import { ISoftDelete } from '../../../core/interfaces';
import { VacinacaoRepositoryDrizzle } from './repositories';
import { DatabaseService } from '../../../core/database/database.service';
import { UserHelper } from '../../../core/utils';
import { PaginationDto, PaginatedResponse } from '../../../core/dto/pagination.dto';
import { calculatePaginationParams, createPaginatedResponse } from '../../../core/utils/pagination.utils';

/**
 * Serviço de gerenciamento de vacinações aplicadas em búfalos.
 *
 * Este serviço gerencia o registro de vacinações, incluindo:
 * - Registro de aplicação de vacinas
 * - Controle de dosagem e unidade de medida
 * - Gestão de datas de aplicação e retorno
 * - Vinculação com medicações cadastradas
 * - Soft-delete para manter histórico
 *
 * **Persistência:**
 * Os dados são armazenados na tabela `dadossanitarios` com tipo 'vacinação'.
 *
 * **Campos Principais:**
 * - idMedicacao: Referência à vacina cadastrada
 * - dtAplicacao: Data de aplicação da vacina
 * - dosagem: Quantidade aplicada
 * - unidade_medida: ml, mg, etc.
 * - necessita_retorno: Se requer reforço
 * - dtRetorno: Data programada para reforço
 *
 * @class VacinacaoService
 * @implements {ISoftDelete}
 */
@Injectable()
export class VacinacaoService implements ISoftDelete {
  constructor(
    private readonly repository: VacinacaoRepositoryDrizzle,
    private readonly logger: LoggerService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Registra nova vacinação para um búfalo.
   *
   * **Fluxo:**
   * 1. Busca ID interno do usuário autenticado
   * 2. Cria registro na tabela dadossanitarios
   * 3. Formata campos de data para padronização
   *
   * @param dto - Dados da vacinação (idMedicacao, dtAplicacao, dosagem, etc.)
   * @param id_bufalo - ID do búfalo que recebeu a vacina
   * @param auth_uuid - UUID do usuário autenticado (do JWT)
   * @returns Registro de vacinação criado com datas formatadas
   * @throws {NotFoundException} Se medicação ou búfalo não existir
   */
  async create(dto: CreateVacinacaoDto, id_bufalo: string, auth_uuid: string) {
    // Buscar ID interno do usuário via helper
    const internalUserId = await UserHelper.getInternalUserId(this.databaseService, auth_uuid);

    const data = await this.repository.create(dto, id_bufalo, internalUserId);

    return formatDateFields(data);
  }

  async findAllByBufalo(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findByBufalo(id_bufalo, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }

  async findOne(id_sanit: string) {
    const data = await this.repository.findById(id_sanit);

    if (!data) {
      throw new NotFoundException(`Registo de vacinação com ID ${id_sanit} não encontrado.`);
    }

    return formatDateFields(data);
  }

  async update(id_sanit: string, dto: UpdateVacinacaoDto) {
    await this.findOne(id_sanit);

    const data = await this.repository.update(id_sanit, dto);

    return formatDateFields(data);
  }

  async remove(id_sanit: string) {
    return this.softDelete(id_sanit);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const data = await this.repository.softDelete(id);

    return {
      message: 'Registo de vacinação removido com sucesso (soft delete)',
      data: formatDateFields(data),
    };
  }

  async restore(id: string) {
    const registro = await this.repository.findByIdIncludingDeleted(id);

    if (!registro) {
      throw new NotFoundException(`Registo de vacinação com ID ${id} não encontrado`);
    }

    if (!registro.deletedAt) {
      throw new BadRequestException('Este registo não está removido');
    }

    const data = await this.repository.restore(id);

    return {
      message: 'Registo de vacinação restaurado com sucesso',
      data: formatDateFields(data),
    };
  }

  async findAllWithDeleted(): Promise<any[]> {
    const data = await this.repository.findAllWithDeleted();

    // Opcional: filtrar apenas registros de vacinação se necessário
    return formatDateFieldsArray(data);
  }

  /**
   * Método específico para buscar apenas vacinas por IDs específicos da tabela Medicacoes
   */
  async findVacinasByBufaloId(id_bufalo: string, paginationDto: PaginationDto = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const { offset } = calculatePaginationParams(page, limit);

    const { data, total } = await this.repository.findVacinasByBufalo(id_bufalo, limit, offset);

    return createPaginatedResponse(formatDateFieldsArray(data), total, page, limit);
  }
}
