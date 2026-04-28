import { Module } from '@nestjs/common';
import { DadosZootecnicosModule } from './dados-zootecnicos/dados-zootecnicos.module';
import { MedicamentosModule } from './medicamentos/medicamentos.module';
import { DadosSanitariosModule } from './dados-sanitarios/dados-sanitarios.module';
import { VacinacaoModule } from './vacinacao/vacinacao.module';

@Module({
  imports: [DadosZootecnicosModule, MedicamentosModule, DadosSanitariosModule, VacinacaoModule],
})
export class SaudeZootecniaModule {}
