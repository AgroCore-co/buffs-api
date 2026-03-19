import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Cria uma nova conta no Supabase Auth
   * ⚠️ NÃO cria perfil no banco - use AuthFacadeService para fluxo completo
   */
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      this.logger.logError(error, { module: 'Auth', method: 'signUp', email });
      if (error.message.includes('already registered')) {
        throw new BadRequestException('Email já está em uso');
      }
      throw new BadRequestException(`Erro ao criar usuário: ${error.message}`);
    }

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
      session: data.session,
      message: 'Usuário criado com sucesso. Verifique seu email para confirmar a conta.',
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.logError(error, { module: 'Auth', method: 'signIn', email });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase.getClient().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      this.logger.logError(error, { module: 'Auth', method: 'refresh' });
      throw new UnauthorizedException('Token de refresh inválido');
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata,
      },
    };
  }

  async signOut(accessToken: string) {
    const { error } = await this.supabase.getAdminClient().auth.admin.signOut(accessToken);

    if (error) {
      this.logger.logError(error, { module: 'Auth', method: 'signOut' });
      throw new BadRequestException('Erro ao fazer logout');
    }

    return { message: 'Logout realizado com sucesso' };
  }
}
