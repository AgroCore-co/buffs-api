import { Module } from '@nestjs/common';
import { DadosZootecnicosController } from './dados-zootecnicos.controller';
import { DadosZootecnicosService } from './dados-zootecnicos.service';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DadosZootecnicosRepositoryDrizzle } from './repositories';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [DadosZootecnicosController],
  providers: [DadosZootecnicosService, DadosZootecnicosRepositoryDrizzle],
})
export class DadosZootecnicosModule {}
