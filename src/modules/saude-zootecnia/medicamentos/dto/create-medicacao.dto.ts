import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMedicacaoDto {
  @ApiProperty({ description: 'ID da propriedade onde a medicação está sendo utilizada (UUID)', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID('4', { message: 'O idPropriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idPropriedade é obrigatório' })
  idPropriedade: string;

  @ApiProperty({ description: 'Tipo de tratamento', example: 'Vermifugação' })
  @IsString({ message: 'O tipo de tratamento deve ser um texto' })
  @MaxLength(30, { message: 'O tipo de tratamento deve ter no máximo 30 caracteres' })
  @IsNotEmpty({ message: 'O tipo de tratamento é obrigatório' })
  tipoTratamento: string;

  @ApiProperty({ description: 'Nome da medicação', example: 'Ivermectina' })
  @IsString({ message: 'O nome da medicação deve ser um texto' })
  @MaxLength(30, { message: 'O nome da medicação deve ter no máximo 30 caracteres' })
  @IsNotEmpty({ message: 'O nome da medicação é obrigatório' })
  medicacao: string;

  @ApiProperty({ description: 'Descrição da medicação', example: 'Antiparasitário de amplo espectro', required: false })
  @IsString({ message: 'A descrição deve ser um texto' })
  @IsOptional()
  @MaxLength(100, { message: 'A descrição deve ter no máximo 100 caracteres' })
  descricao?: string;
}
