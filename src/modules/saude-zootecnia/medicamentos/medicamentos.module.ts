import { Module } from '@nestjs/common';
import { MedicamentosController } from './medicamentos.controller';
import { MedicamentosService } from './medicamentos.service';
import { DatabaseModule } from '../../../core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { MedicamentosRepositoryDrizzle } from './repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [MedicamentosController],
  providers: [MedicamentosService, MedicamentosRepositoryDrizzle],
})
export class MedicamentosModule {}
