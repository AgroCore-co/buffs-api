import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseUsuarioDto } from './base-usuario.dto';
import { Cargo } from '../enums/cargo.enum';

/**
 * DTO para criação de funcionários (GERENTE, FUNCIONARIO, VETERINARIO)
 *
 * Endpoint: POST /funcionarios
 *
 * Estende BaseUsuarioDto e adiciona campos específicos para funcionários.
 */
export class CreateFuncionarioDto extends BaseUsuarioDto {
  // Herda: nome, telefone, id_endereco

  @ApiProperty({
    description: 'Email do funcionário para login',
    example: 'carlos.pereira@buffs.com',
    required: true,
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Senha temporária para o primeiro acesso do funcionário (mínimo 6 caracteres)',
    example: 'senha123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Cargo do funcionário no sistema',
    enum: Cargo,
    enumName: 'Cargo',
    example: Cargo.FUNCIONARIO,
    required: true,
    examples: {
      gerente: {
        value: Cargo.GERENTE,
        description: 'Pode gerenciar usuários mas não propriedades',
      },
      funcionario: {
        value: Cargo.FUNCIONARIO,
        description: 'Acesso apenas às operações básicas',
      },
      veterinario: {
        value: Cargo.VETERINARIO,
        description: 'Acesso especializado em área veterinária',
      },
    },
  })
  @IsEnum(Cargo, {
    message: 'Cargo deve ser: GERENTE, FUNCIONARIO ou VETERINARIO (PROPRIETARIO não é permitido)',
  })
  @IsNotEmpty({ message: 'Cargo é obrigatório' })
  cargo: Cargo;

  @ApiProperty({
    description: 'ID da propriedade onde o funcionário irá trabalhar (UUID). Se não fornecido, será vinculado às propriedades do proprietário',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsUUID('4', { message: 'ID da propriedade deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idPropriedade?: string;
}
