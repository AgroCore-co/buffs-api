import { Module } from '@nestjs/common';
import { OrdenhaModule } from './ordenha/ordenha.module';
import { ProducaoDiariaModule } from './producao-diaria/producao-diaria.module';
import { RetiradaModule } from './retirada/retirada.module';
import { LactacaoModule } from './lactacao/lactacao.module';
import { LaticiniosModule } from './laticinios/laticinios.module';
import { PredicaoProducaoModule } from './predicao-producao/predicao-producao.module';

@Module({
  imports: [OrdenhaModule, ProducaoDiariaModule, RetiradaModule, LactacaoModule, LaticiniosModule, PredicaoProducaoModule],
})
export class ProducaoModule {}
