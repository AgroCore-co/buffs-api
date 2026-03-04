import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from './core/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RebanhoModule } from './modules/rebanho/rebanho.module';
import { GestaoPropriedadeModule } from './modules/gestao-propriedade/gestao-propriedade.module';
import { AlimentacaoModule } from './modules/alimentacao/alimentacao.module';
import { SaudeZootecniaModule } from './modules/saude-zootecnia/saude-zootecnia.module';
import { ReproducaoModule } from './modules/reproducao/reproducao.module';
import { ProducaoModule } from './modules/producao/producao.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AlertasModule } from './modules/alerta/alerta.module';
import { AlertsConsumerModule } from './modules/alerta/consumers/alerts-consumer.module';
import { ImportacaoModule } from './modules/importacao/importacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Rate Limiting: 10 requisições por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 50, // 50 requisições
      },
    ]),
    SupabaseModule,
    AuthModule,
    UsuarioModule,
    RebanhoModule,
    GestaoPropriedadeModule,
    AlimentacaoModule,
    SaudeZootecniaModule,
    ReproducaoModule,
    ProducaoModule,
    HealthModule,
    DashboardModule,
    AlertasModule,
    AlertsConsumerModule,
    ImportacaoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
