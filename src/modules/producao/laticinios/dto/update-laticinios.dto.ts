import { PartialType } from '@nestjs/swagger';
import { CreateLaticiniosDto } from './create-laticinios.dto';

export class UpdateLaticiniosDto extends PartialType(CreateLaticiniosDto) {}
