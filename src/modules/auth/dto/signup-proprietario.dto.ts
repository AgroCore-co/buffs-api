import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, Matches, MaxLength, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para registro completo de proprietário
 * Combina criação de conta de autenticação + perfil no sistema
 *
 * Endpoint: POST /auth/signup-proprietario
 */
export class SignUpProprietarioDto {
  @ApiProperty({
    description: 'Email do proprietário',
    example: 'proprietario@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha do proprietário (mínimo 6 caracteres)',
    example: 'minhasenha123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nome completo do proprietário',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Telefone do proprietário (apenas números, 10 ou 11 dígitos)',
    example: '11999999999',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos' })
  telefone?: string;

  @ApiProperty({
    description: 'ID do endereço associado ao proprietário (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID('4', { message: 'ID do endereço deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_endereco?: string;
}
