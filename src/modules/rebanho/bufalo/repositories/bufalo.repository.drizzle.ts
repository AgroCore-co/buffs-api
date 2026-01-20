import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, or, inArray, ilike, sql, desc, asc, count, isNull } from 'drizzle-orm';
import { bufalo, raca, grupo, propriedade } from 'src/database/schema';

/**
 * Repository para queries de búfalos usando Drizzle ORM.
 * POC: Implementação paralela ao repositório Supabase original.
 *
 * **Responsabilidades:**
 * - Executar queries no PostgreSQL via Drizzle
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 *
 * **Diferenças principais do Supabase:**
 * - Usa conexão TCP direta ao PostgreSQL (não HTTP/PostgREST)
 * - Type-safe baseado no schema introspectado
 * - Paginação via .limit().offset() ao invés de .range()
 */
@Injectable()
export class BufaloRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Busca búfalo completo por ID com todos os relacionamentos.
   * Equivalente ao método original findById().
   */
  async findById(id_bufalo: string) {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: and(eq(bufalo.idBufalo, id_bufalo), isNull(bufalo.deletedAt)),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
              idDono: true,
            },
          },
        },
      });

      return result || null;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalo: ${error.message}`);
    }
  }

  /**
   * Busca búfalos com filtros dinâmicos e paginação.
   * Equivalente ao método original findWithFilters().
   *
   * @param filtros Objeto com filtros opcionais
   * @param pagination Paginação (offset, limit)
   * @param orderBy Ordenação (campo e direção)
   * @returns Búfalos filtrados
   */
  async findWithFilters(
    filtros: {
      id_propriedade?: string | string[];
      id_raca?: string;
      sexo?: string;
      nivel_maturidade?: string;
      status?: boolean;
      brinco?: string;
      id_grupo?: string;
      microchip?: string;
      nome?: string;
    },
    pagination: { offset: number; limit: number },
    orderBy: Array<{ field: string; ascending: boolean }> = [
      { field: 'status', ascending: false },
      { field: 'dt_nascimento', ascending: true },
    ],
  ) {
    try {
      const db = this.databaseService.db;

      // Construir condições WHERE dinamicamente
      const conditions: any[] = [isNull(bufalo.deletedAt)];

      if (filtros.id_propriedade) {
        if (Array.isArray(filtros.id_propriedade)) {
          conditions.push(inArray(bufalo.idPropriedade, filtros.id_propriedade));
        } else {
          conditions.push(eq(bufalo.idPropriedade, filtros.id_propriedade));
        }
      }

      if (filtros.id_raca) {
        conditions.push(eq(bufalo.idRaca, filtros.id_raca));
      }

      if (filtros.sexo) {
        conditions.push(eq(bufalo.sexo, filtros.sexo));
      }

      if (filtros.nivel_maturidade) {
        conditions.push(eq(bufalo.nivelMaturidade, filtros.nivel_maturidade));
      }

      if (filtros.status !== undefined) {
        conditions.push(eq(bufalo.status, filtros.status));
      }

      if (filtros.brinco) {
        // Busca progressiva: "IZ" encontra "IZ-001", "IZ-002" mas não "BUF-IZ-001"
        conditions.push(ilike(bufalo.brinco, `${filtros.brinco}%`));
      }

      if (filtros.id_grupo) {
        conditions.push(eq(bufalo.idGrupo, filtros.id_grupo));
      }

      if (filtros.microchip) {
        conditions.push(eq(bufalo.microchip, filtros.microchip));
      }

      if (filtros.nome) {
        // Otimização: Busca apenas pelo início do nome para usar índices
        conditions.push(ilike(bufalo.nome, `${filtros.nome}%`));
      }

      // Construir ordenação dinamicamente
      const orderByClause: any[] = [];
      for (const order of orderBy) {
        const fieldName = order.field as keyof typeof bufalo;
        const field = bufalo[fieldName];
        // Verifica se é uma coluna válida (não é função ou objeto Table)
        if (field && typeof field === 'object' && 'name' in field) {
          orderByClause.push(order.ascending ? asc(field as any) : desc(field as any));
        }
      }

      // Executar query com joins, filtros, ordenação e paginação
      const result = await db.query.bufalo.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
        orderBy: orderByClause.length > 0 ? orderByClause : undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Conta búfalos com filtros (para paginação).
   * Equivalente ao método original countWithFilters().
   */
  async countWithFilters(filtros: {
    id_propriedade?: string | string[];
    id_raca?: string;
    sexo?: string;
    nivel_maturidade?: string;
    status?: boolean;
    brinco?: string;
    id_grupo?: string;
    microchip?: string;
    nome?: string;
  }) {
    try {
      const db = this.databaseService.db;

      // Construir as mesmas condições
      const conditions: any[] = [];

      if (filtros.id_propriedade) {
        if (Array.isArray(filtros.id_propriedade)) {
          conditions.push(inArray(bufalo.idPropriedade, filtros.id_propriedade));
        } else {
          conditions.push(eq(bufalo.idPropriedade, filtros.id_propriedade));
        }
      }

      if (filtros.id_raca) conditions.push(eq(bufalo.idRaca, filtros.id_raca));
      if (filtros.sexo) conditions.push(eq(bufalo.sexo, filtros.sexo));
      if (filtros.nivel_maturidade) conditions.push(eq(bufalo.nivelMaturidade, filtros.nivel_maturidade));
      if (filtros.status !== undefined) conditions.push(eq(bufalo.status, filtros.status));
      if (filtros.brinco) conditions.push(ilike(bufalo.brinco, `${filtros.brinco}%`));
      if (filtros.id_grupo) conditions.push(eq(bufalo.idGrupo, filtros.id_grupo));
      if (filtros.microchip) conditions.push(eq(bufalo.microchip, filtros.microchip));
      if (filtros.nome) conditions.push(ilike(bufalo.nome, `%${filtros.nome}%`));

      // Executar count
      const [result] = await db
        .select({ count: count() })
        .from(bufalo)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { count: result.count, error: null };
    } catch (error) {
      return { count: 0, error };
    }
  }

  /**
   * Cria novo búfalo.
   * Equivalente ao método original create().
   */
  async create(data: any) {
    try {
      const db = this.databaseService.db;

      const result = await db.insert(bufalo).values(data).returning();
      const novoBufalo = result[0];

      return novoBufalo;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao criar búfalo: ${error.message}`);
    }
  }

  /**
   * Atualiza búfalo por ID.
   * Equivalente ao método original update().
   */
  async update(id_bufalo: string, data: any) {
    try {
      const db = this.databaseService.db;

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const [result] = await db.update(bufalo).set(updateData).where(eq(bufalo.idBufalo, id_bufalo)).returning();

      if (!result) {
        throw new InternalServerErrorException('Búfalo não encontrado');
      }

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar búfalo: ${error.message}`);
    }
  }

  /**
   * Busca búfalo por microchip em propriedades específicas.
   * Equivalente ao método original findByMicrochip().
   */
  async findByMicrochip(microchip: string, id_propriedades: string[]) {
    try {
      const result = await this.databaseService.db.query.bufalo.findFirst({
        where: and(eq(bufalo.microchip, microchip), inArray(bufalo.idPropriedade, id_propriedades)),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });

      return result || null;
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Busca búfalos ativos (status = true) de uma lista de IDs.
   * Equivalente ao método original findActiveByIds().
   */
  async findActiveByIds(ids: string[]) {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: and(inArray(bufalo.idBufalo, ids), eq(bufalo.status, true)),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalos ativos: ${error.message}`);
    }
  }

  /**
   * Atualiza múltiplos búfalos em lote.
   * Equivalente ao método original updateMany().
   */
  async updateMany(ids: string[], data: any) {
    try {
      const db = this.databaseService.db;

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const result = await db.update(bufalo).set(updateData).where(inArray(bufalo.idBufalo, ids)).returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao atualizar búfalos em lote: ${error.message}`);
    }
  }

  /**
   * Remove búfalo por ID (soft delete).
   * Equivalente ao método original delete().
   */
  async delete(id_bufalo: string) {
    try {
      const db = this.databaseService.db;

      const deleted = await db.delete(bufalo).where(eq(bufalo.idBufalo, id_bufalo)).returning();
      const result = deleted[0];

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao deletar búfalo: ${error.message}`);
    }
  }

  /**
   * Verifica se búfalo tem descendentes (filhos).
   * Equivalente ao método original hasOffspring().
   */
  async hasOffspring(id_bufalo: string): Promise<boolean> {
    try {
      const db = this.databaseService.db;

      const [result] = await db
        .select({ count: count() })
        .from(bufalo)
        .where(or(eq(bufalo.idPai, id_bufalo), eq(bufalo.idMae, id_bufalo)))
        .limit(1);

      return result.count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca búfalos por ID do pai.
   * Equivalente ao método original findByPai().
   */
  async findByPai(id_pai: string) {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: eq(bufalo.idPai, id_pai),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalos por pai: ${error.message}`);
    }
  }

  /**
   * Busca búfalos por ID da mãe.
   * Equivalente ao método original findByMae().
   */
  async findByMae(id_mae: string) {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: eq(bufalo.idMae, id_mae),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalos por mãe: ${error.message}`);
    }
  }

  /**
   * Soft delete: marca búfalo como removido
   */
  async softDelete(id_bufalo: string) {
    try {
      const db = this.databaseService.db;

      const [result] = await db.update(bufalo).set({ deletedAt: new Date().toISOString() }).where(eq(bufalo.idBufalo, id_bufalo)).returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao remover búfalo: ${error.message}`);
    }
  }

  /**
   * Restaura búfalo removido logicamente
   */
  async restore(id_bufalo: string) {
    try {
      const db = this.databaseService.db;

      const [result] = await db.update(bufalo).set({ deletedAt: null }).where(eq(bufalo.idBufalo, id_bufalo)).returning();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar búfalo: ${error.message}`);
    }
  }

  /**
   * Busca todos os búfalos incluindo os removidos
   */
  async findAllWithDeleted(propriedadesUsuario: string[]) {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: inArray(bufalo.idPropriedade, propriedadesUsuario),
        with: {
          raca: {
            columns: {
              nome: true,
              descricao: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
        },
        orderBy: [desc(bufalo.deletedAt), desc(bufalo.dtNascimento)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalos: ${error.message}`);
    }
  }

  /**
   * Busca búfalos por categoria ABCB
   */
  async findByCategoria(categoria: string, propriedadesUsuario: string[]) {
    try {
      const result = await this.databaseService.db.query.bufalo.findMany({
        where: and(
          eq(bufalo.categoria, categoria),
          inArray(bufalo.idPropriedade, propriedadesUsuario),
          isNull(bufalo.deletedAt),
          eq(bufalo.status, true),
        ),
        with: {
          raca: {
            columns: {
              nome: true,
            },
          },
          grupo: {
            columns: {
              nomeGrupo: true,
            },
          },
          propriedade: {
            columns: {
              nome: true,
            },
          },
        },
        orderBy: [asc(bufalo.nome)],
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao buscar búfalos por categoria: ${error.message}`);
    }
  }

  /**
   * Inativa um búfalo com data e motivo específicos.
   *
   * **Responsabilidades:**
   * - Atualizar status para false
   * - Registrar data_baixa e motivo_inativo
   * - Atualizar timestamp de updated_at
   *
   * **Validações de negócio (feitas no Service):**
   * - Búfalo existe
   * - Búfalo está ativo
   * - Data de baixa não é anterior à data de nascimento
   *
   * @param id_bufalo UUID do búfalo
   * @param data_baixa Data da baixa/inativação
   * @param motivo_inativo Motivo da inativação
   * @returns Búfalo inativado com todos os dados atualizados
   * @throws InternalServerErrorException se houver erro na query
   */
  async inativar(id_bufalo: string, data_baixa: Date, motivo_inativo: string) {
    try {
      const [bufaloInativado] = await this.databaseService.db
        .update(bufalo)
        .set({
          status: false,
          dataBaixa: data_baixa.toISOString(),
          motivoInativo: motivo_inativo,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(bufalo.idBufalo, id_bufalo))
        .returning();

      if (!bufaloInativado) {
        throw new InternalServerErrorException('Búfalo não encontrado após atualização');
      }

      return bufaloInativado;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao inativar búfalo: ${error.message}`);
    }
  }

  /**
   * Reativa um búfalo inativado (remove data e motivo de baixa).
   *
   * **Responsabilidades:**
   * - Atualizar status para true
   * - Limpar data_baixa e motivo_inativo
   * - Atualizar timestamp de updated_at
   *
   * **Validações de negócio (feitas no Service):**
   * - Búfalo existe
   * - Búfalo está inativo
   *
   * @param id_bufalo UUID do búfalo
   * @returns Búfalo reativado com todos os dados atualizados
   * @throws InternalServerErrorException se houver erro na query
   */
  async reativar(id_bufalo: string) {
    try {
      const [bufaloReativado] = await this.databaseService.db
        .update(bufalo)
        .set({
          status: true,
          dataBaixa: null,
          motivoInativo: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(bufalo.idBufalo, id_bufalo))
        .returning();

      if (!bufaloReativado) {
        throw new InternalServerErrorException('Búfalo não encontrado após atualização');
      }

      return bufaloReativado;
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao reativar búfalo: ${error.message}`);
    }
  }
}
