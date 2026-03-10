import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class ImportRequestDto {
  @ApiProperty({
    description: 'UUID da propriedade rural onde os dados serão importados.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'propriedadeId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'propriedadeId é obrigatório' })
  propriedadeId: string;
}
