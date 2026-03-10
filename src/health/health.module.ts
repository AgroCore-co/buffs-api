import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RabbitMQHealthIndicator } from './rabbitmq-health.indicator';
import { RabbitMQModule } from 'src/core/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
})
export class HealthModule {}
