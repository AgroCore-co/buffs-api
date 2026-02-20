import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';

/**
 * Guard que verifica se o email do usuário foi verificado no Supabase Auth
 *
 * Uso: @UseGuards(SupabaseAuthGuard, EmailVerifiedGuard)
 *
 * ⚠️ Requer que o usuário esteja autenticado (use SupabaseAuthGuard antes)
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se usuário não está autenticado, deixa o AuthGuard lidar com isso
    if (!user?.authId) {
      return true;
    }

    // Busca dados do usuário no Supabase Auth
    const { data: authUser, error } = await this.supabaseService.getClient().auth.admin.getUserById(user.authId);

    if (error || !authUser) {
      throw new ForbiddenException('Não foi possível verificar o status do email.');
    }

    // Verifica se o email foi confirmado
    if (!authUser.user.email_confirmed_at) {
      throw new ForbiddenException('Email não verificado. Verifique sua caixa de entrada e confirme seu email antes de acessar esta funcionalidade.');
    }

    return true;
  }
}
