import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Valida se a data não está no futuro
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: unknown, _args: ValidationArguments) {
    if (!date) return true; // Deixa @IsOptional() tratar
    const inputDate = new Date(date as string);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return inputDate <= today;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'A data não pode estar no futuro';
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}

/**
 * Valida idade máxima (ex: 50 anos para búfalos)
 */
@ValidatorConstraint({ name: 'maxAge', async: false })
export class MaxAgeConstraint implements ValidatorConstraintInterface {
  validate(birthDate: unknown, args: ValidationArguments) {
    if (!birthDate) return true;

    const maxYears = (args.constraints[0] as number) ?? 50;
    const birth = new Date(birthDate as string);
    const now = new Date();

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return age <= maxYears;
  }

  defaultMessage(args: ValidationArguments) {
    const maxYears = (args.constraints[0] as number) ?? 50;
    return `A idade não pode ser superior a ${maxYears} anos`;
  }
}

export function MaxAge(maxYears: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxYears],
      validator: MaxAgeConstraint,
    });
  };
}

/**
 * Valida idade mínima (ex: 18 meses para reprodução)
 */
@ValidatorConstraint({ name: 'minAge', async: false })
export class MinAgeConstraint implements ValidatorConstraintInterface {
  validate(birthDate: unknown, args: ValidationArguments) {
    if (!birthDate) return true;

    const minMonths = args.constraints[0] as number;
    const birth = new Date(birthDate as string);
    const now = new Date();

    const monthsDiff = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());

    return monthsDiff >= minMonths;
  }

  defaultMessage(args: ValidationArguments) {
    const minMonths = args.constraints[0];
    const years = Math.floor(minMonths / 12);
    const months = minMonths % 12;
    let message = 'Idade mínima: ';
    if (years > 0) message += `${years} ano(s)`;
    if (years > 0 && months > 0) message += ' e ';
    if (months > 0) message += `${months} mês(es)`;
    return message;
  }
}

export function MinAge(minMonths: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minMonths],
      validator: MinAgeConstraint,
    });
  };
}

/**
 * Valida se data fim é posterior à data início
 */
@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments) {
    if (!endDate) return true;

    const startDateField = args.constraints[0] as string;
    const startDate = (args.object as Record<string, unknown>)[startDateField];

    if (!startDate) return true;

    return new Date(endDate as string) > new Date(startDate as string);
  }

  defaultMessage(args: ValidationArguments) {
    const startDateField = args.constraints[0];
    return `A data deve ser posterior a ${startDateField}`;
  }
}

export function IsAfterDate(startDateField: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startDateField],
      validator: IsAfterDateConstraint,
    });
  };
}

/**
 * Valida intervalo máximo entre duas datas
 */
@ValidatorConstraint({ name: 'maxDateInterval', async: false })
export class MaxDateIntervalConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments) {
    if (!endDate) return true;

    const startDateField = args.constraints[0] as string;
    const maxDays = args.constraints[1] as number;
    const startDate = (args.object as Record<string, unknown>)[startDateField];

    if (!startDate) return true;

    const diffTime = new Date(endDate as string).getTime() - new Date(startDate as string).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= maxDays;
  }

  defaultMessage(args: ValidationArguments) {
    const maxDays = args.constraints[1];
    return `O intervalo entre as datas não pode ser superior a ${maxDays} dias`;
  }
}

export function MaxDateInterval(startDateField: string, maxDays: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startDateField, maxDays],
      validator: MaxDateIntervalConstraint,
    });
  };
}

/**
 * Valida intervalo mínimo entre duas datas
 */
@ValidatorConstraint({ name: 'minDateInterval', async: false })
export class MinDateIntervalConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments) {
    if (!endDate) return true;

    const startDateField = args.constraints[0] as string;
    const minDays = args.constraints[1] as number;
    const startDate = (args.object as Record<string, unknown>)[startDateField];

    if (!startDate) return true;

    const diffTime = new Date(endDate as string).getTime() - new Date(startDate as string).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= minDays;
  }

  defaultMessage(args: ValidationArguments) {
    const minDays = args.constraints[1];
    return `O intervalo entre as datas deve ser de pelo menos ${minDays} dias`;
  }
}

export function MinDateInterval(startDateField: string, minDays: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [startDateField, minDays],
      validator: MinDateIntervalConstraint,
    });
  };
}
