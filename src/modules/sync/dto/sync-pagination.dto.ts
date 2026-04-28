import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class SyncPaginationDto {
  @ApiProperty({
    description: 'Numero da pagina (comeca em 1)',
    example: 1,
    required: false,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Numero de itens por pagina para sincronizacao',
    example: 200,
    required: false,
    minimum: 1,
    maximum: 200,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 200;

  @ApiProperty({
    description: 'Parametro reservado para sincronizacao incremental futura',
    example: '2026-04-07T12:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  updated_at?: string;
}
