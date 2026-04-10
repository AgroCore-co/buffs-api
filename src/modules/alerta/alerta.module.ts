import { Module } from '@nestjs/common';
import { AlertasController } from './alerta.controller';
import { AlertasScheduler } from './alerta.scheduler';
import { AlertasProvidersModule } from './alerta.providers.module';

@Module({
  imports: [AlertasProvidersModule],
  controllers: [AlertasController],
  providers: [AlertasScheduler],
  exports: [AlertasProvidersModule],
})
export class AlertasModule {}
