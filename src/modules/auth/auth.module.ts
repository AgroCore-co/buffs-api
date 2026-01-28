import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseStrategy } from './supabase.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthFacadeService } from './auth-facade.service';
import { CoreModule } from '../../core/core.module';
import { LoggerModule } from '../../core/logger/logger.module';

// Importar repositórios do módulo Usuario
import { UsuarioRepositoryDrizzle } from '../usuario/repositories/usuario.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from '../usuario/repositories/usuario-propriedade.repository.drizzle';
import { PropriedadeRepositoryHelper } from '../usuario/repositories/helper/propriedade.repository.helper';

@Module({
  imports: [
    PassportModule,
    CoreModule, // Para ter acesso ao SupabaseService e DatabaseService
    LoggerModule, // Para ter acesso ao LoggerService
  ],
  controllers: [AuthController],
  providers: [
    SupabaseStrategy,
    AuthService,
    AuthFacadeService,
    // Repositórios necessários para AuthFacadeService
    UsuarioRepositoryDrizzle,
    UsuarioPropriedadeRepositoryDrizzle,
    PropriedadeRepositoryHelper,
    // Rate Limiting global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SupabaseStrategy, AuthService, AuthFacadeService],
})
export class AuthModule {}
