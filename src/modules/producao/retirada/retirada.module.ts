import { Module } from '@nestjs/common';
import { RetiradaService } from './retirada.service';
import { RetiradaController } from './retirada.controller';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { RetiradaRepository } from './repositories';

@Module({
  imports: [LoggerModule, AuthModule, DatabaseModule],
  controllers: [RetiradaController],
  providers: [RetiradaService, RetiradaRepository],
  exports: [RetiradaService],
})
export class RetiradaModule {}
