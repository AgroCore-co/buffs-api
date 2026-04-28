import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/core/database/database.service';
import { dadossanitarios, medicacoes } from 'src/database/schema';
import { DadosSanitariosRepositoryDrizzle } from '../../dados-sanitarios/repositories';
import { getTipoTratamentoAliases, TipoTratamentoMedicacao } from '../../medicamentos/enums';
import { CreateVacinacaoDto } from '../dto/create-vacinacao.dto';
import { UpdateVacinacaoDto } from '../dto/update-vacinacao.dto';

/**
 * Repository específico para Vacinação
 * Encapsula o repository de DadosSanitarios, pois vacinação usa a mesma tabela
 * Adiciona lógica específica de vacinação (filtros, validações, etc)
 */
@Injectable()
export class VacinacaoRepositoryDrizzle {
  private readonly vacinacaoAliases = getTipoTratamentoAliases(TipoTratamentoMedicacao.VACINACAO);

  constructor(
    private readonly dadosSanitariosRepository: DadosSanitariosRepositoryDrizzle,
    private readonly databaseService: DatabaseService,
  ) {}

  private vacinaTipoTratamentoPredicate() {
    const normalizedTipoTratamento = sql`LOWER(REGEXP_REPLACE(COALESCE(${medicacoes.tipoTratamento}, ''), '[^a-zA-Z0-9]+', '', 'g'))`;

    const aliasPredicates = this.vacinacaoAliases.map((alias) => sql`${normalizedTipoTratamento} = ${alias}`);
    const legacyAliasPredicate = aliasPredicates.length > 0 ? sql`(${sql.join(aliasPredicates, sql` OR `)})` : sql`FALSE`;

    return sql`(
      UPPER(COALESCE(${medicacoes.tipoTratamento}, '')) = ${TipoTratamentoMedicacao.VACINACAO}
      OR ${legacyAliasPredicate}
      OR (
        COALESCE(${medicacoes.tipoTratamento}, '') = ''
        AND (
          LOWER(COALESCE(${medicacoes.medicacao}, '')) LIKE 'vacina%'
          OR LOWER(COALESCE(${medicacoes.medicacao}, '')) LIKE 'imuniza%'
        )
      )
    )`;
  }

  private vacinaWhereByBufalo(idBufalo: string) {
    return and(eq(dadossanitarios.idBufalo, idBufalo), isNull(dadossanitarios.deletedAt), this.vacinaTipoTratamentoPredicate());
  }

  /**
   * Cria um registro de vacinação
   * Converte DTO de vacinação para formato de dados sanitários
   */
  async create(dto: CreateVacinacaoDto, idBufalo: string, idUsuario: string) {
    const sanitarioDto = {
      idBufalo: idBufalo,
      idMedicao: dto.idMedicacao,
      dtAplicacao: dto.dtAplicacao,
      dosagem: dto.dosagem || 0,
      unidade_medida: dto.unidade_medida || 'ml',
      doenca: dto.doenca || 'Vacinação Preventiva',
      necessita_retorno: dto.necessita_retorno || false,
      dtRetorno: dto.dtRetorno,
    };

    return this.dadosSanitariosRepository.create(sanitarioDto, idUsuario, sanitarioDto.doenca);
  }

  /**
   * Busca todas as vacinações de um búfalo
   */
  async findByBufalo(idBufalo: string, limit: number, offset: number) {
    return this.findVacinasByBufalo(idBufalo, limit, offset);
  }

  /**
   * Busca registros de vacinação de um búfalo usando identificação semântica de vacina.
   */
  async findVacinasByBufalo(idBufalo: string, limit: number, offset: number) {
    const whereClause = this.vacinaWhereByBufalo(idBufalo);

    const [data, totalResult] = await Promise.all([
      this.databaseService.db
        .select({
          idSanit: dadossanitarios.idSanit,
          idBufalo: dadossanitarios.idBufalo,
          idUsuario: dadossanitarios.idUsuario,
          idMedicao: dadossanitarios.idMedicao,
          dtAplicacao: dadossanitarios.dtAplicacao,
          dosagem: dadossanitarios.dosagem,
          unidadeMedida: dadossanitarios.unidadeMedida,
          doenca: dadossanitarios.doenca,
          necessitaRetorno: dadossanitarios.necessitaRetorno,
          dtRetorno: dadossanitarios.dtRetorno,
          observacao: dadossanitarios.observacao,
          createdAt: dadossanitarios.createdAt,
          updatedAt: dadossanitarios.updatedAt,
          deletedAt: dadossanitarios.deletedAt,
          medicacoe: {
            medicacao: medicacoes.medicacao,
            tipoTratamento: medicacoes.tipoTratamento,
          },
        })
        .from(dadossanitarios)
        .leftJoin(medicacoes, eq(dadossanitarios.idMedicao, medicacoes.idMedicacao))
        .where(whereClause)
        .orderBy(desc(dadossanitarios.dtAplicacao))
        .limit(limit)
        .offset(offset),
      this.databaseService.db
        .select({ count: count() })
        .from(dadossanitarios)
        .leftJoin(medicacoes, eq(dadossanitarios.idMedicao, medicacoes.idMedicacao))
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    };
  }

  /**
   * Busca uma vacinação por ID
   */
  async findById(idSanit: string) {
    return this.dadosSanitariosRepository.findById(idSanit);
  }

  async findByIdIncludingDeleted(idSanit: string) {
    return this.dadosSanitariosRepository.findByIdIncludingDeleted(idSanit);
  }

  /**
   * Atualiza uma vacinação
   */
  async update(idSanit: string, dto: UpdateVacinacaoDto) {
    const updateDto = {
      idMedicao: dto.idMedicacao,
      dtAplicacao: dto.dtAplicacao,
      dosagem: dto.dosagem,
      unidade_medida: dto.unidade_medida,
      doenca: dto.doenca,
      necessita_retorno: dto.necessita_retorno,
      dtRetorno: dto.dtRetorno,
    };

    return this.dadosSanitariosRepository.update(idSanit, updateDto, updateDto.doenca);
  }

  /**
   * Remove logicamente uma vacinação
   */
  async softDelete(idSanit: string) {
    return this.dadosSanitariosRepository.softDelete(idSanit);
  }

  /**
   * Restaura uma vacinação removida
   */
  async restore(idSanit: string) {
    return this.dadosSanitariosRepository.restore(idSanit);
  }

  /**
   * Lista todas as vacinações incluindo removidas
   */
  async findAllWithDeleted() {
    return this.dadosSanitariosRepository.findAllWithDeleted();
  }

  /**
   * Valida se uma medicação é uma vacina
   */
  async findMedicacaoById(idMedicacao: string) {
    return this.dadosSanitariosRepository.findMedicacaoById(idMedicacao);
  }
}
