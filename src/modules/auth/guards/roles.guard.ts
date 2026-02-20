import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Cargo } from '../../usuario/enums/cargo.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Cargo[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true; // Se não há roles definidas, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.cargo) {
      throw new ForbiddenException('Usuário não possui cargo definido');
    }

    const hasRole = requiredRoles.includes(user.cargo);

    if (!hasRole) {
      throw new ForbiddenException(`Acesso negado. Cargos permitidos: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
