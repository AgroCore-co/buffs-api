import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { GenealogiaController } from './genealogia.controller';
import { GenealogiaService } from './genealogia.service';
import { GenealogiaIAService } from './genealogia-ia.service';
import { GenealogiaRepositoryDrizzle } from './repositories/genealogia.repository.drizzle';
import { AuthModule } from '../../auth/auth.module';
import { LoggerModule } from '../../../core/logger/logger.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { UsuarioModule } from '../../usuario/usuario.module';

@Module({
  imports: [AuthModule, LoggerModule, DatabaseModule, CacheModule.register(), UsuarioModule, HttpModule, ConfigModule],
  controllers: [GenealogiaController],
  providers: [GenealogiaService, GenealogiaIAService, GenealogiaRepositoryDrizzle],
  exports: [GenealogiaService, GenealogiaIAService],
})
export class GenealogiaModule {}
