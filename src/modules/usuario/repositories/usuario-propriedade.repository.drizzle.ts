import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { eq, and, inArray } from 'drizzle-orm';
import { usuariopropriedade, propriedade, usuario } from '../../../database/schema';

@Injectable()
export class UsuarioPropriedadeRepositoryDrizzle {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Vincula um usuário a uma ou mais propriedades
   */
  async vincular(idUsuario: string, idsPropriedades: string[]) {
    if (idsPropriedades.length === 0) {
      return;
    }

    const vinculos = idsPropriedades.map((idPropriedade) => ({
      idUsuario,
      idPropriedade,
    }));

    await this.db.db.insert(usuariopropriedade).values(vinculos).onConflictDoNothing();
  }

  /**
   * Lista todas as propriedades de um usuário
   */
  async listarPropriedadesPorUsuario(idUsuario: string) {
    const resultado = await this.db.db
      .select({
        id_propriedade: usuariopropriedade.idPropriedade,
      })
      .from(usuariopropriedade)
      .where(eq(usuariopropriedade.idUsuario, idUsuario));

    return resultado.map((r) => r.id_propriedade);
  }

  /**
   * Lista todos os funcionários de uma propriedade
   */
  async listarUsuariosPorPropriedade(idPropriedade: string) {
    const resultado = await this.db.db
      .select()
      .from(usuariopropriedade)
      .innerJoin(usuario, eq(usuariopropriedade.idUsuario, usuario.idUsuario))
      .where(eq(usuariopropriedade.idPropriedade, idPropriedade));

    return resultado.map(({ usuario: usuarioData }) => usuarioData);
  }

  /**
   * Lista funcionários de múltiplas propriedades
   */
  async listarUsuariosPorPropriedades(idsPropriedades: string[]) {
    if (idsPropriedades.length === 0) {
      return [];
    }

    const resultado = await this.db.db
      .select()
      .from(usuariopropriedade)
      .innerJoin(usuario, eq(usuariopropriedade.idUsuario, usuario.idUsuario))
      .innerJoin(propriedade, eq(usuariopropriedade.idPropriedade, propriedade.idPropriedade))
      .where(inArray(usuariopropriedade.idPropriedade, idsPropriedades));

    return resultado.map(({ usuario: usuarioData, propriedade: propriedadeData }) => ({
      ...usuarioData,
      propriedade: {
        id_propriedade: propriedadeData.idPropriedade,
        nome: propriedadeData.nome,
      },
    }));
  }

  /**
   * Remove vínculo entre usuário e propriedade
   */
  async desvincular(idUsuario: string, idPropriedade: string) {
    const resultado = await this.db.db
      .delete(usuariopropriedade)
      .where(and(eq(usuariopropriedade.idUsuario, idUsuario), eq(usuariopropriedade.idPropriedade, idPropriedade)))
      .returning();

    return resultado.length > 0;
  }

  /**
   * Remove todos os vínculos de propriedades de um usuário
   */
  async desvincularTodasDoUsuario(idUsuario: string) {
    const resultado = await this.db.db
      .delete(usuariopropriedade)
      .where(eq(usuariopropriedade.idUsuario, idUsuario))
      .returning({ idUsuario: usuariopropriedade.idUsuario });

    return resultado.length;
  }

  /**
   * Verifica se usuário está vinculado a uma propriedade
   */
  async estaVinculado(idUsuario: string, idPropriedade: string) {
    const resultado = await this.db.db
      .select()
      .from(usuariopropriedade)
      .where(and(eq(usuariopropriedade.idUsuario, idUsuario), eq(usuariopropriedade.idPropriedade, idPropriedade)))
      .limit(1);

    return resultado.length > 0;
  }
}
