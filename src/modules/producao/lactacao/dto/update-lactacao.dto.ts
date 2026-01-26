import { PartialType } from '@nestjs/swagger';
import { CreateCicloLactacaoDto } from './create-lactacao.dto';

export class UpdateCicloLactacaoDto extends PartialType(CreateCicloLactacaoDto) {}
