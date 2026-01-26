import { Module } from '@nestjs/common';
import { LoteModule } from './lote/lote.module';
import { PropriedadeModule } from './propriedade/propriedade.module';
import { EnderecoModule } from './endereco/endereco.module';

@Module({
  imports: [LoteModule, PropriedadeModule, EnderecoModule],
  exports: [LoteModule, PropriedadeModule, EnderecoModule],
})
export class GestaoPropriedadeModule {}
