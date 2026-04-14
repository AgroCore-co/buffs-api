import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLaticiniosDto {
  @ApiPropertyOptional({ example: 'Laticínios Búfalo Dourado', description: 'Nome da indústria/laticínio' })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: 'Carlos Silva', description: 'Nome do representante comercial' })
  @IsString({ message: 'O representante deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'O representante deve ter no máximo 100 caracteres' })
  representante?: string;

  @ApiPropertyOptional({ example: '(13) 99999-8888', description: 'Telefone ou email de contato' })
  @IsString({ message: 'O contato deve ser uma string' })
  @IsOptional()
  @MaxLength(100, { message: 'O contato deve ter no máximo 100 caracteres' })
  contato?: string;

  @ApiPropertyOptional({ example: 'Coleta realizada às segundas e quintas.', description: 'Observações gerais' })
  @IsString({ message: 'A observação deve ser uma string' })
  @IsOptional()
  @MaxLength(500, { message: 'A observação deve ter no máximo 500 caracteres' })
  observacao?: string;
}
