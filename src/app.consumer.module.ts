import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlertsConsumerModule } from './modules/alerta/consumers/alerts-consumer.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AlertsConsumerModule],
})
export class AppConsumerModule {}
