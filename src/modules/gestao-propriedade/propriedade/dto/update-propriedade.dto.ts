import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePropriedadeDto } from './create-propriedade.dto';

export class UpdatePropriedadeDto extends PartialType(
	OmitType(CreatePropriedadeDto, ['cnpj', 'idEndereco'] as const),
) {}
