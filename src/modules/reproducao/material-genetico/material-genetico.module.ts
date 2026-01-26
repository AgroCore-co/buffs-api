import { Module } from '@nestjs/common';
import { MaterialGeneticoService } from './material-genetico.service';
import { MaterialGeneticoController } from './material-genetico.controller';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { MaterialGeneticoRepositoryDrizzle } from './repositories/material-genetico.repository.drizzle';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [MaterialGeneticoController],
  providers: [MaterialGeneticoService, MaterialGeneticoRepositoryDrizzle],
  exports: [MaterialGeneticoService],
})
export class MaterialGeneticoModule {}
