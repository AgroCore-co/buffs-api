import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../core/database/database.service';
import { eq, inArray, or } from 'drizzle-orm';
import { bufalo } from '../../../../database/schema';

/**
 * Repository para queries de genealogia usando Drizzle ORM.
 *
 * **Responsabilidades:**
 * - Executar queries recursivas de árvore genealógica
 * - Retornar dados brutos (sem processamento)
 * - Não contém lógica de negócio
 */
@Injectable()
export class GenealogiaRepositoryDrizzle {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Busca búfalo por ID com informações de raça
   */
  async findBufaloById(idBufalo: string) {
    const result = await this.databaseService.db.query.bufalo.findFirst({
      where: eq(bufalo.idBufalo, idBufalo),
      with: {
        raca: {
          columns: {
            nome: true,
          },
        },
      },
    });

    return result || null;
  }

  /**
   * Busca búfalo apenas com IDs de pai e mãe (para recursão)
   */
  async findBufaloWithParents(idBufalo: string) {
    const result = await this.databaseService.db.query.bufalo.findFirst({
      where: eq(bufalo.idBufalo, idBufalo),
      columns: {
        idBufalo: true,
        idRaca: true,
        categoria: true,
        nome: true,
        idPai: true,
        idMae: true,
      },
    });

    return result || null;
  }

  /**
   * Busca ID da propriedade do búfalo
   */
  async getBufaloPropriedadeId(idBufalo: string): Promise<string | null> {
    const result = await this.databaseService.db.query.bufalo.findFirst({
      where: eq(bufalo.idBufalo, idBufalo),
      columns: {
        idPropriedade: true,
      },
    });

    return result?.idPropriedade || null;
  }

  /**
   * Verifica se um búfalo tem descendentes (é pai ou mãe)
   */
  async verificarDescendentes(idBufalo: string): Promise<boolean> {
    const result = await this.databaseService.db.query.bufalo.findFirst({
      where: or(eq(bufalo.idPai, idBufalo), eq(bufalo.idMae, idBufalo)),
      columns: {
        idBufalo: true,
      },
    });

    return !!result;
  }

  /**
   * Busca nome e ID de múltiplos búfalos em uma única query (batch lookup)
   */
  async findBufalosByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();

    const results = await this.databaseService.db.query.bufalo.findMany({
      where: inArray(bufalo.idBufalo, ids),
      columns: {
        idBufalo: true,
        nome: true,
      },
    });

    return new Map(results.map((b) => [b.idBufalo, b.nome ?? 'Sem nome']));
  }
}
