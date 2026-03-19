import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum NichoAlerta {
  CLINICO = 'CLINICO',
  SANITARIO = 'SANITARIO',
  REPRODUCAO = 'REPRODUCAO',
  MANEJO = 'MANEJO',
  PRODUCAO = 'PRODUCAO',
}

export enum PrioridadeAlerta {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class CreateAlertaDto {
  @ApiProperty({ description: 'ID do búfalo relacionado ao alerta', example: 12, required: false })
  @IsUUID()
  @IsOptional()
  animal_id?: string;

  @ApiProperty({ description: 'Nome do grupo/lote do animal', example: 'Lote A-01', required: false })
  @IsString()
  @IsOptional()
  grupo?: string;

  @ApiProperty({ description: 'Nome da propriedade onde o animal está', example: 'Fazenda Santa Clara', required: false })
  @IsString()
  @IsOptional()
  localizacao?: string;

  @ApiProperty({ description: 'ID da propriedade onde o alerta foi gerado (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({ description: 'Motivo detalhado do alerta', example: 'Previsão de parto para os próximos 15 dias.' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiProperty({ description: 'Categoria do alerta', enum: NichoAlerta, example: NichoAlerta.REPRODUCAO })
  @IsEnum(NichoAlerta)
  @IsNotEmpty()
  nicho: NichoAlerta;

  @ApiProperty({ description: 'Data prevista para o evento do alerta', example: '2025-10-25T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  data_alerta: string;

  @ApiProperty({ description: 'Prioridade do alerta', enum: PrioridadeAlerta, example: PrioridadeAlerta.MEDIA, required: false })
  @IsEnum(PrioridadeAlerta)
  @IsOptional()
  prioridade?: PrioridadeAlerta;

  @ApiProperty({
    description:
      'Descrição clínica detalhada para classificação automática de prioridade pela IA. Se fornecida e prioridade não for especificada, a IA analisará e definirá automaticamente.',
    required: false,
    example: 'Animal apresentando febre alta de 40°C, dificuldade respiratória moderada, perda de apetite há 3 dias, e secreção nasal purulenta.',
  })
  @IsString()
  @IsOptional()
  texto_ocorrencia_clinica?: string;

  @ApiProperty({ description: 'Observações adicionais', required: false, example: 'Animal de primeira cria.' })
  @IsString()
  @IsOptional()
  observacao?: string;

  @ApiProperty({ description: 'Indica se o alerta já foi visualizado', example: false, required: false })
  @IsBoolean()
  @IsOptional()
  visto?: boolean;

  @ApiProperty({ description: 'ID do evento que originou o alerta', required: false, example: 123 })
  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_evento_origem?: string;

  @ApiProperty({ description: 'Tipo do evento que originou o alerta', required: false, example: 'DADOS_SANITARIOS' })
  @IsString()
  @IsOptional()
  tipo_evento_origem?: string;
}

export class UpdateAlertaDto extends PartialType(CreateAlertaDto) {}
