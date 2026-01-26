import { Module } from '@nestjs/common';
import { GrupoController } from './grupo.controller';
import { GrupoService } from './grupo.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { GrupoRepositoryDrizzle } from './repositories';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule, DatabaseModule],
  controllers: [GrupoController],
  providers: [GrupoService, GrupoRepositoryDrizzle],
  exports: [GrupoService, GrupoRepositoryDrizzle],
})
export class GrupoModule {}
