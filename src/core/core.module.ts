import { Module } from '@nestjs/common';
import { GeminiModule } from './gemini/gemini.module';
import { LoggerModule } from './logger/logger.module';
import { SupabaseModule } from './supabase/supabase.module';
import { CacheConfigModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, DatabaseModule],
  providers: [CacheService],
  exports: [GeminiModule, LoggerModule, SupabaseModule, CacheConfigModule, CacheService, DatabaseModule],
})
export class CoreModule {}
