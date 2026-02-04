import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull, desc, sql, count } from 'drizzle-orm';
import { dadossanitarios, bufalo, medicacoes, usuario } from 'src/database/schema';
import { CreateDadosSanitariosDto } from '../dto/create-dados-sanitarios.dto';
import { UpdateDadosSanitariosDto } from '../dto/update-dados-sanitarios.dto';

@Injectable()
export class DadosSanitariosRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateDadosSanitariosDto, idUsuario: string, doencaNormalizada?: string) {
    try {
      const [result] = await this.databaseService.db
        .insert(dadossanitarios)
        .values({
          idBufalo: dto.idBufalo,
          idMedicao: dto.idMedicao,
          dtAplicacao: dto.dtAplicacao,
          dosagem: dto.dosagem ? String(dto.dosagem) : null,
          unidadeMedida: dto.unidade_medida,
          doenca: doencaNormalizada || dto.doenca,
          necessitaRetorno: dto.necessita_retorno,
          dtRetorno: dto.dtRetorno,
          idUsuario: idUsuario,
        })
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar dado sanitário: ${error.message}`);
    }
  }

  async findAll(limit: number, offset: number) {
    try {
      const [data, totalResult] = await Promise.all([
        this.databaseService.db.query.dadossanitarios.findMany({
          where: isNull(dadossanitarios.deletedAt),
          with: {
            bufalo: {
              columns: {
                brinco: true,
                nome: true,
              },
            },
            medicacoe: {
              columns: {
                medicacao: true,
                tipoTratamento: true,
              },
            },
          },
          limit,
          offset,
          orderBy: [desc(dadossanitarios.createdAt)],
        }),
        this.databaseService.db.select({ count: count() }).from(dadossanitarios).where(isNull(dadossanitarios.deletedAt)),
      ]);

      return {
        data,
        total: totalResult[0].count,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados sanitários: ${error.message}`);
    }
  }

  async findByBufalo(idBufalo: string, limit: number, offset: number) {
    try {
      const [data, totalResult] = await Promise.all([
        this.databaseService.db.query.dadossanitarios.findMany({
          where: and(eq(dadossanitarios.idBufalo, idBufalo), isNull(dadossanitarios.deletedAt)),
          with: {
            medicacoe: {
              columns: {
                medicacao: true,
                tipoTratamento: true,
              },
            },
          },
          limit,
          offset,
          orderBy: [desc(dadossanitarios.dtAplicacao)],
        }),
        this.databaseService.db
          .select({ count: count() })
          .from(dadossanitarios)
          .where(and(eq(dadossanitarios.idBufalo, idBufalo), isNull(dadossanitarios.deletedAt))),
      ]);

      return {
        data,
        total: totalResult[0].count,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados sanitários do búfalo: ${error.message}`);
    }
  }

  async findByPropriedade(idPropriedade: string, limit: number, offset: number) {
    try {
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
            bufalo: {
              brinco: bufalo.brinco,
              nome: bufalo.nome,
            },
            medicacoes: {
              medicacao: medicacoes.medicacao,
              tipoTratamento: medicacoes.tipoTratamento,
            },
          })
          .from(dadossanitarios)
          .leftJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
          .leftJoin(medicacoes, eq(dadossanitarios.idMedicao, medicacoes.idMedicacao))
          .where(and(eq(bufalo.idPropriedade, idPropriedade), isNull(dadossanitarios.deletedAt), isNull(bufalo.deletedAt)))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(dadossanitarios.createdAt)),
        this.databaseService.db
          .select({ count: count() })
          .from(dadossanitarios)
          .leftJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
          .where(and(eq(bufalo.idPropriedade, idPropriedade), isNull(dadossanitarios.deletedAt), isNull(bufalo.deletedAt))),
      ]);

      return {
        data,
        total: totalResult[0].count,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados sanitários da propriedade: ${error.message}`);
    }
  }

  async findById(idSanit: string) {
    try {
      const result = await this.databaseService.db.query.dadossanitarios.findFirst({
        where: and(eq(dadossanitarios.idSanit, idSanit), isNull(dadossanitarios.deletedAt)),
        with: {
          bufalo: {
            columns: {
              brinco: true,
              nome: true,
            },
          },
          medicacoe: {
            columns: {
              medicacao: true,
              tipoTratamento: true,
              descricao: true,
            },
          },
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dado sanitário: ${error.message}`);
    }
  }

  async update(idSanit: string, dto: UpdateDadosSanitariosDto, doencaNormalizada?: string) {
    try {
      const updateData: Record<string, any> = {
        updatedAt: sql`now()`,
      };

      if (dto.idBufalo !== undefined) updateData.idBufalo = dto.idBufalo;
      if (dto.idMedicao !== undefined) updateData.idMedicao = dto.idMedicao;
      if (dto.dtAplicacao !== undefined) updateData.dtAplicacao = dto.dtAplicacao;
      if (dto.dosagem !== undefined) updateData.dosagem = String(dto.dosagem);
      if (dto.unidade_medida !== undefined) updateData.unidadeMedida = dto.unidade_medida;
      if (dto.doenca !== undefined) updateData.doenca = doencaNormalizada || dto.doenca;
      if (dto.necessita_retorno !== undefined) updateData.necessitaRetorno = dto.necessita_retorno;
      if (dto.dtRetorno !== undefined) updateData.dtRetorno = dto.dtRetorno;

      const [result] = await this.databaseService.db
        .update(dadossanitarios)
        .set(updateData)
        .where(and(eq(dadossanitarios.idSanit, idSanit), isNull(dadossanitarios.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar dado sanitário: ${error.message}`);
    }
  }

  async softDelete(idSanit: string) {
    try {
      const [result] = await this.databaseService.db
        .update(dadossanitarios)
        .set({ deletedAt: sql`now()` })
        .where(and(eq(dadossanitarios.idSanit, idSanit), isNull(dadossanitarios.deletedAt)))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao deletar dado sanitário: ${error.message}`);
    }
  }

  async restore(idSanit: string) {
    try {
      const [result] = await this.databaseService.db
        .update(dadossanitarios)
        .set({ deletedAt: null })
        .where(eq(dadossanitarios.idSanit, idSanit))
        .returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar dado sanitário: ${error.message}`);
    }
  }

  async findAllWithDeleted() {
    try {
      const result = await this.databaseService.db.query.dadossanitarios.findMany({
        orderBy: [desc(dadossanitarios.createdAt)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar dados sanitários com deletados: ${error.message}`);
    }
  }

  async findFrequenciaDoencas(idPropriedade?: string) {
    try {
      const query = this.databaseService.db
        .select({
          doenca: sql<string>`LOWER(TRIM(${dadossanitarios.doenca}))`,
          frequencia: count(),
        })
        .from(dadossanitarios)
        .where(and(isNull(dadossanitarios.deletedAt), sql`${dadossanitarios.doenca} IS NOT NULL`, sql`TRIM(${dadossanitarios.doenca}) != ''`))
        .groupBy(sql`LOWER(TRIM(${dadossanitarios.doenca}))`)
        .orderBy(desc(count()));

      // Se filtrar por propriedade, adicionar join
      if (idPropriedade) {
        const result = await this.databaseService.db
          .select({
            doenca: sql<string>`LOWER(TRIM(${dadossanitarios.doenca}))`,
            frequencia: count(),
          })
          .from(dadossanitarios)
          .leftJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
          .where(
            and(
              isNull(dadossanitarios.deletedAt),
              sql`${dadossanitarios.doenca} IS NOT NULL`,
              sql`TRIM(${dadossanitarios.doenca}) != ''`,
              eq(bufalo.idPropriedade, idPropriedade),
            ),
          )
          .groupBy(sql`LOWER(TRIM(${dadossanitarios.doenca}))`)
          .orderBy(desc(count()));

        return result;
      }

      return await query;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar frequência de doenças: ${error.message}`);
    }
  }

  async countTotalRegistros(idPropriedade?: string) {
    try {
      if (idPropriedade) {
        const result = await this.databaseService.db
          .select({ count: count() })
          .from(dadossanitarios)
          .leftJoin(bufalo, eq(dadossanitarios.idBufalo, bufalo.idBufalo))
          .where(and(isNull(dadossanitarios.deletedAt), eq(bufalo.idPropriedade, idPropriedade)));

        return result[0].count;
      }

      const result = await this.databaseService.db.select({ count: count() }).from(dadossanitarios).where(isNull(dadossanitarios.deletedAt));

      return result[0].count;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao contar registros: ${error.message}`);
    }
  }

  async findMedicacaoById(idMedicacao: string) {
    try {
      const result = await this.databaseService.db.query.medicacoes.findFirst({
        where: eq(medicacoes.idMedicacao, idMedicacao),
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar medicação: ${error.message}`);
    }
  }
}
