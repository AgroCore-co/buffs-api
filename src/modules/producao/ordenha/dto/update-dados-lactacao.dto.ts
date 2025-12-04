import { PartialType } from '@nestjs/swagger';
import { CreateDadosLactacaoDto } from './create-ordenha.dto';

export class UpdateDadosLactacaoDto extends PartialType(CreateDadosLactacaoDto) {}
