import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsDateString, ValidateIf, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovLoteDto {
  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID da propriedade (UUID)' })
  @IsUUID('4', { message: 'O idPropriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idPropriedade é obrigatório' })
  idPropriedade: string;

  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do grupo de animais que está sendo movido' })
  @IsUUID('4', { message: 'O idGrupo deve ser um UUID válido' })
  idGrupo: string;

  @ApiProperty({
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    description: 'ID do lote de origem (opcional - será detectado automaticamente se não informado)',
    required: false,
  })
  @IsUUID('4', { message: 'O idLoteAnterior deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idLoteAnterior?: string;

  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do lote de destino (para onde o grupo está se movendo)' })
  @IsUUID('4', { message: 'O idLoteAtual deve ser um UUID válido' })
  idLoteAtual: string;

  @ApiProperty({ example: '2025-01-15T08:00:00Z', description: 'Data e hora de entrada do grupo no novo lote' })
  @IsDateString({}, { message: 'A data de entrada deve estar no formato ISO 8601 válido' })
  dtEntrada: string;

  @ApiProperty({
    example: '2025-09-20',
    description: 'Data de saída do grupo do lote atual (opcional)',
    required: false,
  })
  @IsDateString({}, { message: 'A data de saída deve estar no formato ISO 8601 válido' })
  @IsOptional()
  @ValidateIf((o) => o.dtSaida !== null)
  dtSaida?: string;
}
