import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AnaliseGenealogicaDto {
  @ApiProperty({ description: 'UUID do búfalo', example: 'a1b056f4-a2a8-4e4f-96c1-3d4cc0a7770d' })
  @IsUUID('4', { message: 'O idBufalo deve ser um UUID v\u00e1lido' })
  idBufalo: string;
}
