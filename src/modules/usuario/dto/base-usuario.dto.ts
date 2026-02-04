import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUUID, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO base com campos comuns para criação de usuários
 */
export class BaseUsuarioDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Número de telefone para contato (apenas números, 10 ou 11 dígitos)',
    example: '11999998888',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos' })
  telefone?: string;

  @ApiProperty({
    description: 'ID do endereço associado ao usuário (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID('4', { message: 'ID do endereço deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idEndereco?: string;
}
