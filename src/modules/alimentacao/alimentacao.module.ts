import { Module } from '@nestjs/common';
import { AlimentacaoDefModule } from './alimentacao-def/alimentacao-def.module';
import { RegistrosModule } from './registros/registros.module';

@Module({
  imports: [AlimentacaoDefModule, RegistrosModule],
  exports: [AlimentacaoDefModule, RegistrosModule],
})
export class AlimentacaoModule {}
