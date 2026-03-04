import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * DTO para validação do parâmetro `propriedadeId` na rota.
 *
 * Utilizado em: `POST /importacao/planilha/:propriedadeId`
 *
 * @example
 * ```
 * // Rota válida:
 * POST /importacao/planilha/123e4567-e89b-12d3-a456-426614174000
 * ```
 */
export class ImportacaoPlanilhaParamDto {
  @ApiProperty({
    description: 'UUID da propriedade rural onde os dados serão importados.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'propriedadeId deve ser um UUID v4 válido' })
  @IsNotEmpty({ message: 'propriedadeId é obrigatório' })
  propriedadeId: string;
}
