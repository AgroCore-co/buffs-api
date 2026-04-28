import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoggerService } from '../../core/logger/logger.service';

type AuthErrorType = 'network_timeout_or_connectivity' | 'invalid_credentials' | 'invalid_refresh_token' | 'duplicate_email' | 'provider_error';

@Injectable()
export class AuthService {
  private static readonly NETWORK_ERROR_MARKERS = [
    'fetch failed',
    'connect timeout',
    'timeout',
    'und_err_connect_timeout',
    'und_err',
    'enotfound',
    'econnreset',
    'econnrefused',
    'etimedout',
    'eai_again',
    'network',
    'socket hang up',
  ];

  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private extractSupabaseErrorMetadata(error: unknown): {
    message: string;
    name?: string;
    code?: string;
    status?: number;
    causeMessage?: string;
    causeCode?: string;
  } {
    const rawError = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined;
    const rawCause =
      rawError && typeof rawError.cause === 'object' && rawError.cause !== null ? (rawError.cause as Record<string, unknown>) : undefined;

    const message =
      (rawError && typeof rawError.message === 'string' && rawError.message) ||
      (error instanceof Error ? error.message : undefined) ||
      (typeof error === 'string' ? error : 'Erro desconhecido de autenticação');

    const name = rawError && typeof rawError.name === 'string' ? rawError.name : undefined;
    const code = rawError && typeof rawError.code === 'string' ? rawError.code : undefined;
    const status = rawError && typeof rawError.status === 'number' ? rawError.status : undefined;
    const causeMessage = rawCause && typeof rawCause.message === 'string' ? rawCause.message : undefined;
    const causeCode = rawCause && typeof rawCause.code === 'string' ? rawCause.code : undefined;

    return {
      message,
      name,
      code,
      status,
      causeMessage,
      causeCode,
    };
  }

  private createErrorFromUnknown(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    const metadata = this.extractSupabaseErrorMetadata(error);
    return new Error(metadata.message);
  }

  private isSupabaseNetworkError(error: unknown): boolean {
    const metadata = this.extractSupabaseErrorMetadata(error);
    const haystack = [metadata.message, metadata.name, metadata.code, metadata.causeMessage, metadata.causeCode]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();

    return AuthService.NETWORK_ERROR_MARKERS.some((marker) => haystack.includes(marker));
  }

  private logAuthError(method: string, error: unknown, errorType: AuthErrorType, email?: string) {
    const metadata = this.extractSupabaseErrorMetadata(error);

    this.logger.logError(this.createErrorFromUnknown(error), {
      module: 'Auth',
      method,
      email,
      errorType,
      supabaseStatus: metadata.status,
      errorCode: metadata.code ?? metadata.causeCode,
      errorName: metadata.name,
      causeMessage: metadata.causeMessage,
    });
  }

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
      const metadata = this.extractSupabaseErrorMetadata(error);

      if (this.isSupabaseNetworkError(error)) {
        this.logAuthError('signUp', error, 'network_timeout_or_connectivity', email);
        throw new ServiceUnavailableException('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
      }

      if (metadata.message.includes('already registered')) {
        this.logAuthError('signUp', error, 'duplicate_email', email);
        throw new BadRequestException('Email já está em uso');
      }

      this.logAuthError('signUp', error, 'provider_error', email);
      throw new BadRequestException(`Erro ao criar usuário: ${metadata.message}`);
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
      if (this.isSupabaseNetworkError(error)) {
        this.logAuthError('signIn', error, 'network_timeout_or_connectivity', email);
        throw new ServiceUnavailableException('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
      }

      this.logAuthError('signIn', error, 'invalid_credentials', email);
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
      if (this.isSupabaseNetworkError(error)) {
        this.logAuthError('refresh', error, 'network_timeout_or_connectivity');
        throw new ServiceUnavailableException('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
      }

      this.logAuthError('refresh', error, 'invalid_refresh_token');
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
      if (this.isSupabaseNetworkError(error)) {
        this.logAuthError('signOut', error, 'network_timeout_or_connectivity');
        throw new ServiceUnavailableException('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
      }

      this.logAuthError('signOut', error, 'provider_error');
      throw new BadRequestException('Erro ao fazer logout');
    }

    return { message: 'Logout realizado com sucesso' };
  }
}
