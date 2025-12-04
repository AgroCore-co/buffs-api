import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GenealogiaController } from './genealogia.controller';
import { GenealogiaService } from './genealogia.service';
import { GenealogiaRepositoryDrizzle } from './repositories/genealogia.repository.drizzle';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';

@Module({
  imports: [AuthModule, LoggerModule, DatabaseModule, CacheModule.register()],
  controllers: [GenealogiaController],
  providers: [GenealogiaService, GenealogiaRepositoryDrizzle],
  exports: [GenealogiaService],
})
export class GenealogiaModule {}
