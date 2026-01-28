import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BaseUsuarioDto } from './base-usuario.dto';
import { Cargo } from '../enums/cargo.enum';

/**
 * DTO para criação de perfil de PROPRIETÁRIO
 *
 * Endpoint: POST /usuarios
 *
 * Este DTO é usado após o signup no Supabase Auth.
 * O campo 'cargo' é readonly e sempre PROPRIETARIO.
 */
export class CreateUsuarioDto extends BaseUsuarioDto {
  // Herda: nome, telefone, id_endereco

  @ApiProperty({
    description: 'Cargo do usuário (sempre PROPRIETARIO para este endpoint)',
    enum: Cargo,
    default: Cargo.PROPRIETARIO,
    readOnly: true,
  })
  @IsEnum(Cargo)
  readonly cargo: Cargo = Cargo.PROPRIETARIO;
}
