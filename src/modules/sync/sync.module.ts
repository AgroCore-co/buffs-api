import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { LoggerModule } from '../../core/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import {
  SyncAlertasRepository,
  SyncBufalosRepository,
  SyncCiclosLactacaoRepository,
  SyncEventosSanitariosRepository,
  SyncGruposRepository,
  SyncMedicacoesRepository,
  SyncPesagensRepository,
  SyncRacasRepository,
  SyncRepository,
  SyncReproducaoRepository,
} from './repositories';

@Module({
  imports: [DatabaseModule, AuthModule, DashboardModule, LoggerModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncRepository,
    SyncAlertasRepository,
    SyncBufalosRepository,
    SyncCiclosLactacaoRepository,
    SyncEventosSanitariosRepository,
    SyncGruposRepository,
    SyncMedicacoesRepository,
    SyncPesagensRepository,
    SyncRacasRepository,
    SyncReproducaoRepository,
  ],
})
export class SyncModule {}
