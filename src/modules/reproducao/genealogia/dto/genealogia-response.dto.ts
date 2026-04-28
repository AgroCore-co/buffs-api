import { ApiProperty } from '@nestjs/swagger';

export class GenealogiaNodeDto {
  @ApiProperty({ example: 'b8c4a72d-1234-4567-8901-234567890123', description: 'ID do búfalo (UUID)' })
  id: string;

  @ApiProperty({ example: 'Valente', description: 'Nome do búfalo' })
  nome: string;

  // A anotação do Swagger para tipos recursivos é um pouco diferente.
  // Usamos uma função anônima para evitar problemas de referência circular.
  @ApiProperty({ type: () => GenealogiaNodeDto, required: false, description: 'Pai do búfalo' })
  pai?: GenealogiaNodeDto;

  @ApiProperty({ type: () => GenealogiaNodeDto, required: false, description: 'Mãe do búfalo' })
  mae?: GenealogiaNodeDto;
}
