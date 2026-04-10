import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthFacadeService } from './auth-facade.service';
import { CoreModule } from '../../core/core.module';
import { LoggerModule } from '../../core/logger/logger.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    PassportModule,
    CoreModule, // Para ter acesso ao SupabaseService e DatabaseService
    LoggerModule, // Para ter acesso ao LoggerService
    forwardRef(() => UsuarioModule),
  ],
  controllers: [AuthController],
  providers: [SupabaseStrategy, AuthService, AuthFacadeService],
  exports: [SupabaseStrategy, AuthService, AuthFacadeService],
})
export class AuthModule {}
