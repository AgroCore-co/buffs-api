import { PartialType } from '@nestjs/swagger';
import { CreateEstoqueLeiteDto } from './create-estoque-leite.dto';

export class UpdateEstoqueLeiteDto extends PartialType(CreateEstoqueLeiteDto) {}
