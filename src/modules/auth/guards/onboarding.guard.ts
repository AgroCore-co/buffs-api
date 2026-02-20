import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PropriedadeRepositoryHelper } from '../../usuario/repositories/helper/propriedade.repository.helper';
import { Cargo } from '../../usuario/enums/cargo.enum';

/**
 * Guard que verifica se o proprietário completou o onboarding
 * (possui pelo menos uma propriedade cadastrada)
 *
 * Uso: @UseGuards(SupabaseAuthGuard, OnboardingGuard)
 *
 * ⚠️ Só aplica validação para usuários com cargo PROPRIETARIO
 * Funcionários, gerentes e veterinários não precisam ter propriedades
 */
@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly propriedadeRepository: PropriedadeRepositoryHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se usuário não está autenticado, deixa o AuthGuard lidar com isso
    if (!user?.id) {
      return true;
    }

    // Só valida onboarding para PROPRIETARIOS
    if (user.cargo !== Cargo.PROPRIETARIO) {
      return true;
    }

    // Verifica se o proprietário tem pelo menos uma propriedade
    const propriedades = await this.propriedadeRepository.listarPorDono(user.id);

    if (!propriedades || propriedades.length === 0) {
      throw new ForbiddenException(
        'Onboarding incompleto. Complete seu cadastro criando um endereço e uma propriedade antes de acessar esta funcionalidade.',
      );
    }

    return true;
  }
}
