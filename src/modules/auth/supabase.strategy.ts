import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../core/logger/logger.service';
import { UsuarioRepositoryDrizzle } from '../usuario/repositories/usuario.repository.drizzle';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuarioRepository: UsuarioRepositoryDrizzle,
    private readonly logger: LoggerService,
  ) {
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

    if (!supabaseJwtSecret) {
      throw new Error('A variável de ambiente SUPABASE_JWT_SECRET não foi definida.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabaseJwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      this.logger.logError(new Error('Token sem sub'), {
        module: 'Auth',
        method: 'validate',
        payload,
      });
      throw new UnauthorizedException('Token inválido');
    }

    try {
      const usuario = await this.usuarioRepository.buscarPorAuthId(payload.sub);

      // ✅ PERMITE acesso mesmo sem perfil (para criar perfil depois)
      return {
        id: payload.sub,
        email: payload.email,
        cargo: usuario?.cargo || null, // null se ainda não criou perfil
        id_usuario: usuario?.idUsuario || null,
        nome: usuario?.nome || null,
        ...payload,
      };
    } catch (err) {
      this.logger.logError(err, {
        module: 'Auth',
        method: 'validate',
        context: 'exception',
        auth_id: payload.sub,
      });
      throw new UnauthorizedException('Erro ao validar usuário');
    }
  }
}
