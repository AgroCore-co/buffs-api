import { Module } from '@nestjs/common';
import { OrdenhaService } from './ordenha.service';
import { OrdenhaController } from './ordenha.controller';
import { LoggerModule } from '../../../core/logger/logger.module';
import { AuthModule } from '../../auth/auth.module';
import { AlertasModule } from '../../alerta/alerta.module';
import { GeminiModule } from '../../../core/gemini/gemini.module';
import { DatabaseModule } from '../../../core/database/database.module';
import { RebanhoModule } from '../../rebanho/rebanho.module';
import { UsuarioModule } from '../../usuario/usuario.module';
import { LactacaoModule } from '../lactacao/lactacao.module';
import { GestaoPropriedadeModule } from '../../gestao-propriedade/gestao-propriedade.module';
import { OrdenhaRepositoryDrizzle } from './repositories';

@Module({
  imports: [
    LoggerModule,
    AuthModule,
    AlertasModule,
    GeminiModule,
    DatabaseModule,
    RebanhoModule,
    UsuarioModule,
    LactacaoModule,
    GestaoPropriedadeModule,
  ],
  controllers: [OrdenhaController],
  providers: [OrdenhaService, OrdenhaRepositoryDrizzle],
  exports: [OrdenhaService],
})
export class OrdenhaModule {}
