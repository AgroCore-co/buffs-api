import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  IsDate,
  IsEnum,
  IsPositive,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BufaloValidationUtils } from '../utils/validation.utils';
import { CategoriaABCB } from './categoria-abcb.dto';
import { IsNotFutureDate, MaxAge } from '../../../../core/validators/date.validators';

// Isso melhora a validação, evita erros de digitação e documenta a API no Swagger.
export enum NivelMaturidade {
  BEZERRO = 'B',
  NOVILHO_NOVILHA = 'N',
  VACA = 'V',
  TOURO = 'T',
}

export enum SexoBufalo {
  FEMEA = 'F',
  MACHO = 'M',
}

// Validador customizado para idade máxima de 50 anos
@ValidatorConstraint({ name: 'MaxAgeValidator', async: false })
export class MaxAgeValidator implements ValidatorConstraintInterface {
  validate(birthDate: Date, args: ValidationArguments) {
    return BufaloValidationUtils.validateMaxAge(birthDate);
  }

  defaultMessage(args: ValidationArguments) {
    return 'O búfalo não pode ter mais de 50 anos de idade';
  }
}

// Este DTO define a estrutura de dados para criar um novo búfalo.
// Usamos 'class-validator' para as regras de validação e '@ApiProperty'
// para que o Swagger possa documentar cada campo da API.

export class CreateBufaloDto {
  @ApiProperty({ description: 'Nome de identificação do búfalo.', example: 'Valente', maxLength: 50 })
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(50, { message: 'O nome deve ter no máximo 50 caracteres' })
  nome: string;

  @ApiProperty({ description: 'Código do brinco do búfalo.', example: 'BR54321', required: false, maxLength: 10 })
  @IsString({ message: 'O brinco deve ser um texto' })
  @IsOptional()
  @MaxLength(10, { message: 'O brinco deve ter no máximo 10 caracteres' })
  brinco?: string;

  @ApiProperty({
    description: 'Código de identificação do microchip do búfalo.',
    example: '982000444998877',
    required: false,
    maxLength: 30,
  })
  @IsString({ message: 'O microchip deve ser um texto' })
  @IsOptional()
  @MaxLength(30, { message: 'O microchip deve ter no máximo 30 caracteres' })
  microchip?: string;

  @ApiProperty({
    description:
      'Data de nascimento do búfalo. A idade máxima permitida é 50 anos. O nível de maturidade será calculado automaticamente baseado na idade e sexo.',
    example: '2023-05-20T00:00:00.000Z',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  @IsNotFutureDate({ message: 'A data de nascimento não pode estar no futuro' })
  @MaxAge(50, { message: 'O búfalo não pode ter mais de 50 anos de idade' })
  dtNascimento?: Date;

  @ApiProperty({
    description:
      'Nível de maturidade (B-Bezerro, N-Novilho/Novilha, V-Vaca, T-Touro). Se não informado, será calculado automaticamente baseado na data de nascimento e sexo. Bezerro: 0-12 meses, Novilho/Novilha: 12-24 meses, Vaca: após primeira cria (~3 anos), Touro: machos reprodutores a partir de 24 meses.',
    enum: NivelMaturidade,
    example: NivelMaturidade.NOVILHO_NOVILHA,
    required: false,
  })
  @IsEnum(NivelMaturidade, { message: 'O nível de maturidade deve ser: B (Bezerro), N (Novilho/Novilha), V (Vaca) ou T (Touro)' })
  @IsOptional()
  nivelMaturidade?: NivelMaturidade;

  @ApiProperty({
    description: 'Sexo do búfalo (M ou F).',
    enum: SexoBufalo,
    example: SexoBufalo.FEMEA,
  })
  @IsEnum(SexoBufalo, { message: 'O sexo deve ser M (Macho) ou F (Fêmea)' })
  @IsNotEmpty({ message: 'O sexo é obrigatório' })
  sexo: SexoBufalo;

  @ApiProperty({
    description: 'ID da raça do búfalo. Se não informado e houver dados zootécnicos, o sistema tentará sugerir automaticamente usando IA.',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID('4', { message: 'O idRaca deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idRaca?: string;

  @ApiProperty({ description: 'ID da propriedade onde o búfalo está localizado.', example: 'b8c4a72d-1234-4567-8901-234567890123' })
  @IsUUID('4', { message: 'O idPropriedade deve ser um UUID válido' })
  @IsNotEmpty({ message: 'O idPropriedade é obrigatório' })
  idPropriedade: string;

  @ApiProperty({ description: 'ID do grupo ao qual o búfalo pertence.', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID('4', { message: 'O idGrupo deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idGrupo?: string;

  @ApiProperty({ description: 'ID do búfalo pai (se houver).', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID('4', { message: 'O idPai deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idPai?: string;

  @ApiProperty({ description: 'ID da búfala mãe (se houver).', example: 'b8c4a72d-1234-4567-8901-234567890123', required: false })
  @IsUUID('4', { message: 'O idMae deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  idMae?: string;

  @ApiProperty({
    description:
      'Status do búfalo (true para ativo, false para inativo). Será automaticamente definido como false se a idade for superior a 50 anos.',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'O status deve ser verdadeiro ou falso' })
  @IsOptional()
  status?: boolean = true;

  @ApiProperty({
    description: 'Categoria ABCB do animal (PO, PC, PA, CCG, SRD). Se não informada, será calculada automaticamente baseada na genealogia.',
    enum: CategoriaABCB,
    example: CategoriaABCB.PA,
    required: false,
  })
  @IsEnum(CategoriaABCB, { message: 'A categoria deve ser PO, PC, PA, CCG ou SRD' })
  @IsOptional()
  categoria?: CategoriaABCB;

  @ApiProperty({
    description: 'Origem do animal (ex: Compra, Nascimento na propriedade, Doação, Transferência). Campo livre para registro histórico.',
    example: 'Nascimento na propriedade',
    required: false,
    maxLength: 100,
  })
  @IsString({ message: 'A origem deve ser um texto' })
  @IsOptional()
  @MaxLength(100, { message: 'A origem deve ter no máximo 100 caracteres' })
  origem?: string;

  @ApiProperty({
    description: 'Número do brinco original do animal (caso tenha sido substituído ou alterado ao longo do tempo).',
    example: 'BR12345',
    required: false,
    maxLength: 10,
  })
  @IsString({ message: 'O brinco original deve ser um texto' })
  @IsOptional()
  @MaxLength(10, { message: 'O brinco original deve ter no máximo 10 caracteres' })
  brinco_original?: string;

  @ApiProperty({
    description: 'Número do registro provisório emitido pela Associação Brasileira de Criadores de Búfalos (ABCB).',
    example: 'RP123456',
    required: false,
    maxLength: 50,
  })
  @IsString({ message: 'O registro provisório deve ser um texto' })
  @IsOptional()
  @MaxLength(50, { message: 'O registro provisório deve ter no máximo 50 caracteres' })
  registro_prov?: string;

  @ApiProperty({
    description: 'Número do registro definitivo emitido pela Associação Brasileira de Criadores de Búfalos (ABCB).',
    example: 'RD789012',
    required: false,
    maxLength: 50,
  })
  @IsString({ message: 'O registro definitivo deve ser um texto' })
  @IsOptional()
  @MaxLength(50, { message: 'O registro definitivo deve ter no máximo 50 caracteres' })
  registro_def?: string;

  // ==================== REPRODUÇÃO ASSISTIDA ====================

  @ApiProperty({
    description: 'ID do material genético (sêmen) usado em caso de inseminação artificial. Referencia o búfalo reprodutor doador do sêmen.',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID('4', { message: 'O id_pai_semen deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_pai_semen?: string;

  @ApiProperty({
    description: 'ID do material genético (óvulo) usado em caso de fertilização in vitro (FIV). Referencia a búfala doadora do óvulo.',
    example: 'b8c4a72d-1234-4567-8901-234567890123',
    required: false,
  })
  @IsUUID('4', { message: 'O id_mae_ovulo deve ser um UUID válido' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  id_mae_ovulo?: string;
}
