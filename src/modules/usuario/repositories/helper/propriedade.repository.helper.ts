import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, isNull } from 'drizzle-orm';
import { propriedade } from '../../../../database/schema';

@Injectable()
export class PropriedadeRepositoryHelper {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Busca todas as propriedades de um dono (id_usuario)
   */
  async listarPorDono(idDono: string) {
    const resultado = await this.db.db
      .select({
        id_propriedade: propriedade.idPropriedade,
      })
      .from(propriedade)
      .where(and(eq(propriedade.idDono, idDono), isNull(propriedade.deletedAt)));

    return resultado.map((r) => r.id_propriedade);
  }

  /**
   * Verifica se uma propriedade pertence a um dono
   */
  async pertenceAoDono(idPropriedade: string, idDono: string) {
    const resultado = await this.db.db
      .select({ id_dono: propriedade.idDono })
      .from(propriedade)
      .where(and(eq(propriedade.idPropriedade, idPropriedade), eq(propriedade.idDono, idDono), isNull(propriedade.deletedAt)))
      .limit(1);

    return resultado.length > 0 ? resultado[0] : null;
  }
}
