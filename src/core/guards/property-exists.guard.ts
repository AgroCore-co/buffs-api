import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq } from 'drizzle-orm';
import { propriedade } from '../../database/schema';

@Injectable()
export class PropertyExistsGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id_propriedade;

    if (!id) return true; // sem param, outro guard ou pipe lida

    const exists = await this.db.db.query.propriedade.findFirst({
      where: eq(propriedade.idPropriedade, id),
      columns: { idPropriedade: true },
    });

    if (!exists) throw new NotFoundException(`Propriedade ${id} não encontrada`);
    return true;
  }
}
