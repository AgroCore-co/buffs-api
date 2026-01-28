import { Global, Module } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { UserMappingService } from './services/user-mapping.service';

@Global()
@Module({
  imports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule],
  providers: [UserMappingService],
  exports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule, UserMappingService],
})
export class CoreModule {}
