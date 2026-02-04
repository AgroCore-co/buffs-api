import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNotFutureDate } from '../../../../core/validators/date.validators';

// Tipos de Inseminação:
// - IA (Inseminação Artificial): Uso de sêmen congelado aplicado manualmente
// - IATF (Inseminação Artificial em Tempo Fixo): IA com protocolo hormonal para sincronizar o cio
// - TE (Transferência de Embrião): Implantação de embrião em receptora
// - Monta Natural: Acasalamento natural entre macho e fêmea
const tiposInseminacao = ['IA', 'IATF', 'TE', 'Monta Natural'];

// Status de Reprodução (Regras de Negócio):
// - "Em andamento": Gestação ativa - BLOQUEIA nova cobertura
// - "Confirmada": Reprodução concluída com sucesso - PERMITE nova cobertura
// - "Falhou": Reprodução sem sucesso, animal apto - PERMITE nova cobertura
// - "Concluída": Status legado (equivalente a Confirmada)
const statusValidos = ['Em andamento', 'Confirmada', 'Falhou', 'Concluída'];

export class CreateCoberturaDto {
  @ApiProperty({ description: 'ID da propriedade onde a cobertura foi realizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  idPropriedade: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID do material genético (sêmen para IA/IATF ou embrião para TE)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idSemen?: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID da búfala doadora do óvulo (obrigatório apenas para TE - Transferência de Embrião)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idDoadora?: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID da fêmea receptora (quem está sendo inseminada/coberta)',
  })
  @IsUUID()
  @IsNotEmpty()
  idBufala: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'ID do macho reprodutor (obrigatório apenas para Monta Natural)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idBufalo?: string;

  @ApiProperty({
    example: 'IA',
    description: `Tipo de técnica reprodutiva utilizada:
    
• IA (Inseminação Artificial): Aplicação manual de sêmen congelado no útero da fêmea. Requer id_semen (material genético tipo "Sêmen").

• IATF (Inseminação Artificial em Tempo Fixo): Similar à IA, porém utiliza protocolo hormonal para sincronizar o cio e permitir inseminação programada. Requer id_semen (material genético tipo "Sêmen").

• TE (Transferência de Embrião): Técnica avançada onde um embrião (resultado da fecundação in vitro) é implantado em uma fêmea receptora. Requer id_semen (material genético tipo "Embrião") e id_doadora (búfala que forneceu o óvulo).

• Monta Natural: Acasalamento natural entre o macho reprodutor e a fêmea. Requer id_bufalo (macho reprodutor).`,
    enum: tiposInseminacao,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(tiposInseminacao)
  tipoInseminacao: string;

  @ApiProperty({ example: '2025-08-18', description: 'Data do evento (inseminação ou monta)' })
  @IsDateString()
  @IsNotEmpty()
  @IsNotFutureDate({ message: 'A data do evento não pode estar no futuro' })
  dtEvento: string;

  @ApiProperty({
    example: 'Em andamento',
    description: `Status inicial do processo reprodutivo:

• Em andamento (padrão): Gestação ativa - impede criação de nova cobertura até ser concluída ou marcada como falha

• Confirmada: Reprodução concluída com sucesso - permite nova cobertura futura

• Falhou: Reprodução sem sucesso, animal apto para nova tentativa - permite nova cobertura

• Concluída: Status legado (equivalente a Confirmada)

**Regra:** Apenas "Em andamento" bloqueia criação de nova cobertura.`,
    enum: statusValidos,
    required: false,
    default: 'Em andamento',
  })
  @IsString()
  @IsOptional()
  @IsIn(statusValidos)
  status?: string;
}
