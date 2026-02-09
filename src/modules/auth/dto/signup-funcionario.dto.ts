import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength, Matches, MaxLength, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Cargo } from '../../usuario/enums/cargo.enum';

/**
 * DTO para registro completo de funcionário
 * Combina criação de conta de autenticação + perfil no sistema
 *
 * Endpoint: POST /auth/signup-funcionario (apenas PROPRIETARIO ou GERENTE)
 */
export class SignUpFuncionarioDto {
  @ApiProperty({
    description: 'Email do funcionário',
    example: 'funcionario@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha temporária para primeiro acesso (mínimo 6 caracteres)',
    example: 'senha123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Nome completo do funcionário',
    example: 'Carlos Pereira',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Telefone do funcionário (apenas números, 10 ou 11 dígitos)',
    example: '11999998888',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos' })
  telefone?: string;

  @ApiProperty({
    description: 'Cargo do funcionário no sistema',
    enum: [Cargo.GERENTE, Cargo.FUNCIONARIO, Cargo.VETERINARIO],
    example: Cargo.FUNCIONARIO,
  })
  @IsEnum([Cargo.GERENTE, Cargo.FUNCIONARIO, Cargo.VETERINARIO], {
    message: 'Cargo deve ser: GERENTE, FUNCIONARIO ou VETERINARIO',
  })
  @IsNotEmpty({ message: 'Cargo é obrigatório' })
  cargo: Cargo.GERENTE | Cargo.FUNCIONARIO | Cargo.VETERINARIO;

  @ApiProperty({
    description: 'ID do endereço associado ao funcionário (UUID)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    required: false,
  })
  @IsUUID('4', { message: 'ID do endereço deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idEndereco?: string;

  @ApiProperty({
    description: 'ID da propriedade onde o funcionário irá trabalhar (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsUUID('4', { message: 'ID da propriedade deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idPropriedade?: string;
}
