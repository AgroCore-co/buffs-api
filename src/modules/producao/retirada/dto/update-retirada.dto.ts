import { PartialType } from '@nestjs/swagger';
import { CreateColetaDto } from './create-retirada.dto';

export class UpdateColetaDto extends PartialType(CreateColetaDto) {}
