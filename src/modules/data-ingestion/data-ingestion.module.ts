import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '../../core/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { CacheConfigModule } from '../../core/cache/cache.module';

import { DataIngestionController, DataIngestionJobController } from './controllers/data-ingestion.controller';
import { DataIngestionService } from './services/data-ingestion.service';
import { EtlHttpClient } from './services/etl-http-client.service';
import { DataIngestionValidator } from './validators/data-ingestion.validator';
import { DataIngestionMapper } from './mappers/data-ingestion.mapper';
import { LeitePipeline } from './pipelines/leite.pipeline';
import { PesagemPipeline } from './pipelines/pesagem.pipeline';
import { ReproducaoPipeline } from './pipelines/reproducao.pipeline';
import { ScheduledIngestionJob } from './jobs/scheduled-ingestion.job';
import { ETL_CLIENT } from './interfaces';

@Module({
  imports: [ConfigModule, HttpModule.register({ timeout: 120_000 }), LoggerModule, AuthModule, CacheConfigModule],
  controllers: [DataIngestionController, DataIngestionJobController],
  providers: [
    DataIngestionService,
    {
      provide: ETL_CLIENT,
      useClass: EtlHttpClient,
    },
    DataIngestionValidator,
    DataIngestionMapper,
    LeitePipeline,
    PesagemPipeline,
    ReproducaoPipeline,
    ScheduledIngestionJob,
  ],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
