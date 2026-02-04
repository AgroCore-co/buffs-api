import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SimularAcasalamentoDto {
  @ApiProperty({ description: 'ID do búfalo macho', example: 'b8c4a72d-1234-4567-8901-234567890123' })
  @IsUUID('4', { message: 'O idMacho deve ser um UUID válido' })
  idMacho: string;

  @ApiProperty({ description: 'ID da búfala fêmea', example: 'c9d5b83e-2345-5678-9012-345678901234' })
  @IsUUID('4', { message: 'O idFemea deve ser um UUID válido' })
  idFemea: string;
}
