import { Module } from '@nestjs/common';
import { ProducaoDiariaService } from './producao-diaria.service';
import { ProducaoDiariaController } from './producao-diaria.controller';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { ProducaoDiariaRepository } from './repositories';

@Module({
  imports: [LoggerModule, AuthModule, DatabaseModule],
  controllers: [ProducaoDiariaController],
  providers: [ProducaoDiariaService, ProducaoDiariaRepository],
  exports: [ProducaoDiariaService],
})
export class ProducaoDiariaModule {}
