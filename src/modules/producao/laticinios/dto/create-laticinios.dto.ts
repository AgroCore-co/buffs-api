import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateIndustriaDto {
  @ApiProperty({ description: 'ID da propriedade à qual esta indústria está vinculada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O id_propriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O id_propriedade é obrigatório' })
  id_propriedade: string;

  @ApiProperty({ example: 'Laticínios Búfalo Dourado', description: 'Nome da indústria/laticínio' })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  nome: string;

  @ApiProperty({ example: 'Carlos Silva', description: 'Nome do representante comercial', required: false })
  @IsString({ message: 'O representante deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'O representante deve ter no máximo 100 caracteres' })
  representante?: string;

  @ApiProperty({ example: '(13) 99999-8888', description: 'Telefone ou email de contato', required: false })
  @IsString({ message: 'O contato deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'O contato deve ter no máximo 100 caracteres' })
  contato?: string;

  @ApiProperty({ example: 'Coleta realizada às segundas e quintas.', description: 'Observações gerais', required: false })
  @IsString({ message: 'A observação deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  observacao?: string;
}
