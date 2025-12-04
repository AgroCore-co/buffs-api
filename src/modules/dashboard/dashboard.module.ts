import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepositoryDrizzle } from './repositories';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../../core/logger/logger.module';

@Module({
  imports: [DatabaseModule, AuthModule, LoggerModule, CacheModule.register()],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepositoryDrizzle],
  exports: [DashboardService],
})
export class DashboardModule {}
