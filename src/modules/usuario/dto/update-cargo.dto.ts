import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Cargo } from '../enums/cargo.enum';

/**
 * DTO para atualização de cargo de funcionário
 *
 * Endpoint: PATCH /usuarios/:id/cargo
 *
 * Permite apenas mudança de cargo entre GERENTE, FUNCIONARIO e VETERINARIO.
 * Não permite alteração para/de PROPRIETARIO (regra de negócio).
 */
export class UpdateCargoDto {
  @ApiProperty({
    description: 'Novo cargo do funcionário (GERENTE, FUNCIONARIO ou VETERINARIO)',
    enum: [Cargo.GERENTE, Cargo.FUNCIONARIO, Cargo.VETERINARIO],
    example: Cargo.GERENTE,
  })
  @IsEnum([Cargo.GERENTE, Cargo.FUNCIONARIO, Cargo.VETERINARIO], {
    message: 'Cargo deve ser GERENTE, FUNCIONARIO ou VETERINARIO',
  })
  @IsNotEmpty({ message: 'Cargo é obrigatório' })
  cargo: Cargo;
}
