import { PartialType } from '@nestjs/swagger';
import { CreateProducaoDiariaDto } from './create-producao-diaria.dto';

export class UpdateProducaoDiariaDto extends PartialType(CreateProducaoDiariaDto) {}
