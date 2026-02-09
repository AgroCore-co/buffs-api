import { Global, Module, forwardRef } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { UserMappingService } from './services/user-mapping.service';
import { AuthHelperService } from './services/auth-helper.service';
import { UsuarioModule } from '../modules/usuario/usuario.module';

@Global()
@Module({
  imports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule, forwardRef(() => UsuarioModule)],
  providers: [UserMappingService, AuthHelperService],
  exports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule, UserMappingService, AuthHelperService],
})
export class CoreModule {}
