import { Global, Module, forwardRef } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { UserMappingService } from './services/user-mapping.service';
import { AuthHelperService } from './services/auth-helper.service';
import { PropertyExistsGuard } from './guards/property-exists.guard';
import { UsuarioModule } from '../modules/usuario/usuario.module';

@Global()
@Module({
  imports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule, RabbitMQModule, forwardRef(() => UsuarioModule)],
  providers: [UserMappingService, AuthHelperService, PropertyExistsGuard],
  exports: [
    GeminiModule,
    LoggerModule,
    SupabaseModule,
    CacheConfigModule,
    DatabaseModule,
    RabbitMQModule,
    UserMappingService,
    AuthHelperService,
    PropertyExistsGuard,
  ],
})
export class CoreModule {}
