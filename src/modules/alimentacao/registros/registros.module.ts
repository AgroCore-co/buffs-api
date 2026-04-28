import { Module } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';
import { RegistrosRepositoryDrizzle } from './repositories/registros.repository.drizzle';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { CoreModule } from '../../../core/core.module';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule, CoreModule],
  controllers: [RegistrosController],
  providers: [RegistrosService, RegistrosRepositoryDrizzle],
  exports: [RegistrosService],
})
export class RegistrosModule {}
