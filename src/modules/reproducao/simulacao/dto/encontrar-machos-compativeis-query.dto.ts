import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class EncontrarMachosCompativeisQueryDto {
  @ApiProperty({
    description: 'Consanguinidade maxima aceitavel em %',
    example: 6.25,
    required: false,
    default: 6.25,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsNumber({}, { message: 'A consanguinidade maxima deve ser um numero' })
  @Min(0, { message: 'A consanguinidade maxima deve ser maior ou igual a 0' })
  @Max(100, { message: 'A consanguinidade maxima deve ser menor ou igual a 100' })
  maxConsanguinidade?: number;
}
