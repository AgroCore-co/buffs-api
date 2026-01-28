import { Module } from '@nestjs/common';
import { DadosSanitariosService } from './dados-sanitarios.service';
import { DadosSanitariosController } from './dados-sanitarios.controller';
import { DatabaseModule } from '../../../core/database/database.module';
import { AlertasModule } from '../../alerta/alerta.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DadosSanitariosRepositoryDrizzle } from './repositories';

@Module({
  imports: [DatabaseModule, AlertasModule, AuthModule, LoggerModule],
  controllers: [DadosSanitariosController],
  providers: [DadosSanitariosService, DadosSanitariosRepositoryDrizzle],
  exports: [DadosSanitariosService],
})
export class DadosSanitariosModule {}
