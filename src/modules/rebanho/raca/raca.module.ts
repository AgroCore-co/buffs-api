import { Module } from '@nestjs/common';
import { RacaController } from './raca.controller';
import { RacaService } from './raca.service';
import { SupabaseModule } from '../../../core/supabase/supabase.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { CoreModule } from '../../../core/core.module';
import { RacaRepositoryDrizzle } from './repositories';

@Module({
  imports: [SupabaseModule, LoggerModule, AuthModule, DatabaseModule, CoreModule],
  controllers: [RacaController],
  providers: [RacaService, RacaRepositoryDrizzle],
  exports: [RacaService, RacaRepositoryDrizzle],
})
export class RacaModule {}
