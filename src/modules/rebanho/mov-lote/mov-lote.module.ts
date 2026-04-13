import { Module } from '@nestjs/common';
import { MovLoteService } from './mov-lote.service';
import { MovLoteController } from './mov-lote.controller';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { CoreModule } from '../../../core/core.module';
import { MovLoteRepositoryDrizzle } from './repositories';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule, DatabaseModule, CoreModule],
  controllers: [MovLoteController],
  providers: [MovLoteService, MovLoteRepositoryDrizzle],
  exports: [MovLoteService, MovLoteRepositoryDrizzle],
})
export class MovLoteModule {}
