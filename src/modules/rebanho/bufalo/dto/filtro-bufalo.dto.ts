import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsUUID, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { NivelMaturidade, SexoBufalo } from './create-bufalo.dto';

export class FiltroBufaloDto {
  @ApiProperty({
    description: 'ID da raça para filtrar',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  idRaca?: string;

  @ApiProperty({
    description: 'Sexo do búfalo (M ou F)',
    enum: SexoBufalo,
    example: SexoBufalo.FEMEA,
    required: false,
  })
  @IsEnum(SexoBufalo)
  @IsOptional()
  sexo?: SexoBufalo;

  @ApiProperty({
    description: 'Nível de maturidade (B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro)',
    enum: NivelMaturidade,
    example: NivelMaturidade.NOVILHO_NOVILHA,
    required: false,
  })
  @IsEnum(NivelMaturidade)
  @IsOptional()
  nivelMaturidade?: NivelMaturidade;

  @ApiProperty({
    description: 'Status do búfalo (true para ativo, false para inativo)',
    example: true,
    required: false,
    type: Boolean,
  })
  @Transform(
    ({ value }) => {
      // Se for undefined, null ou string vazia, retorna undefined (sem filtro)
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      // Se já é boolean, retorna como está
      if (typeof value === 'boolean') {
        return value;
      }

      // Converte strings para boolean
      const stringValue = String(value).toLowerCase();
      if (stringValue === 'true' || stringValue === '1') {
        return true;
      }
      if (stringValue === 'false' || stringValue === '0') {
        return false;
      }

      // Valor não reconhecido, retorna undefined
      return undefined;
    },
    { toClassOnly: true },
  )
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiProperty({
    description: 'Início do código do brinco para busca progressiva (ex: "IZ", "IZ-0", "IZ-001")',
    example: 'IZ',
    required: false,
  })
  @IsString()
  @IsOptional()
  brinco?: string;
}
