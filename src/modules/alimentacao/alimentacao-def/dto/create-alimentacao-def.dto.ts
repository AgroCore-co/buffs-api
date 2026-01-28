import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO para criação de definição de alimentação
 *
 * Endpoint: POST /alimentacoes-def
 *
 * Este DTO define os campos necessários para criar uma nova definição de alimentação
 * que pode ser reutilizada em múltiplos registros de alimentação do rebanho.
 */
export class CreateAlimentacaoDefDto {
  @ApiProperty({
    description: 'ID da propriedade à qual esta definição de alimentação pertence (UUID).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  id_propriedade: string;

  @ApiProperty({
    description: 'Tipo de alimentação (texto livre). Ex: Concentrado, Volumoso, Suplemento Mineral, etc.',
    example: 'Concentrado',
    required: true,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo_alimentacao: string;

  @ApiProperty({
    description: 'Descrição detalhada da alimentação, incluindo composição e características.',
    example: 'Ração balanceada para búfalos em fase de recria com 18% de proteína bruta.',
    required: false,
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  descricao?: string;
}
