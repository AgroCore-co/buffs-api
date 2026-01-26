import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';
import { CacheService } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';

        return {
          ttl: 300000, // 5 minutos padrão em millisegundos
          max: isProduction ? 500 : 100, // Mais cache em produção
          isGlobal: true,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    LoggerModule,
  ],
  providers: [CacheService],
  exports: [CacheModule, CacheService],
})
export class CacheConfigModule {}
