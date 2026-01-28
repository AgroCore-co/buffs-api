import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { usuario } from '../../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Serviço para mapeamento entre auth_id (Supabase) e id interno do usuário
 */
@Injectable()
export class UserMappingService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Busca o UUID interno do usuário a partir do auth_id (sub do JWT)
   * @param authUuid UUID de autenticação do Supabase (sub do JWT)
   * @returns UUID interno do usuário na tabela Usuario
   * @throws UnauthorizedException se o usuário não for encontrado
   */
  async getInternalUserId(authUuid: string): Promise<string> {
    const result = await this.db.db.query.usuario.findFirst({
      where: eq(usuario.authId, authUuid),
      columns: { idUsuario: true },
    });

    if (!result) {
      throw new UnauthorizedException(
        `Falha na sincronização do usuário. O usuário (auth: ${authUuid}) não foi encontrado no registro local 'Usuario'.`,
      );
    }

    return result.idUsuario;
  }
}
