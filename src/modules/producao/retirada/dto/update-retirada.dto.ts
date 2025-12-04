import { PartialType } from '@nestjs/swagger';
import { CreateRetiradaDto } from './create-retirada.dto';

export class UpdateRetiradaDto extends PartialType(CreateRetiradaDto) {}
