import { UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { usuario } from 'src/database/schema';
import { eq } from 'drizzle-orm';

/**
 * Helper para operações comuns relacionadas a usuários
 */
export class UserHelper {
  /**
   * Busca o UUID interno do usuário a partir do auth_id (sub do JWT)
   * @param databaseService Instância do DatabaseService
   * @param authUuid UUID de autenticação do Supabase (sub do JWT)
   * @returns UUID interno do usuário na tabela Usuario
   * @throws UnauthorizedException se o usuário não for encontrado
   */
  static async getInternalUserId(databaseService: DatabaseService, authUuid: string): Promise<string> {
    const result = await databaseService.db.query.usuario.findFirst({
      where: eq(usuario.authId, authUuid),
      columns: {
        idUsuario: true,
      },
    });

    if (!result) {
      throw new UnauthorizedException(
        `Falha na sincronização do usuário. O usuário (auth: ${authUuid}) não foi encontrado no registro local 'Usuario'.`,
      );
    }

    return result.idUsuario;
  }
}
