import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncRepository } from './repositories/sync.repository';

@Module({
  imports: [DatabaseModule, AuthModule, DashboardModule],
  controllers: [SyncController],
  providers: [SyncService, SyncRepository],
})
export class SyncModule {}
