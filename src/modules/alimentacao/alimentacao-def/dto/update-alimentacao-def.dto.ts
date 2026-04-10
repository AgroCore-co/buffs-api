import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAlimentacaoDefDto } from './create-alimentacao-def.dto';

/**
 * DTO para atualização de definição de alimentação
 *
 * Endpoint: PATCH /alimentacoes-def/:id
 *
 * Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados.
 * Não é possível alterar o id_propriedade após a criação.
 */
export class UpdateAlimentacaoDefDto extends PartialType(OmitType(CreateAlimentacaoDefDto, ['id_propriedade'] as const)) {}
