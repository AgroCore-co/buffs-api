import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepositoryDrizzle } from './repositories';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../../core/logger/logger.module';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepositoryDrizzle],
  exports: [DashboardService],
})
export class DashboardModule {}
