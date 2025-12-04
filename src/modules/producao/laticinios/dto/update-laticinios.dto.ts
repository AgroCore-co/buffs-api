import { PartialType } from '@nestjs/swagger';
import { CreateIndustriaDto } from './create-laticinios.dto';

export class UpdateIndustriaDto extends PartialType(CreateIndustriaDto) {}
