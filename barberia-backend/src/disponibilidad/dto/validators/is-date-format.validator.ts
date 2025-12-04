import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador personalizado para formato de fecha YYYY-MM-DD
 * Valida:
 * - Formato exacto YYYY-MM-DD (4 dígitos, guion, 2 dígitos, guion, 2 dígitos)
 * - Año entre 1900 y 2100
 * - Mes entre 1 y 12
 * - Día válido según el mes y año (considera años bisiestos)
 */
@ValidatorConstraint({ async: false })
export class IsDateFormatConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    // Validar formato exacto YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return false;
    }

    // Extraer año, mes y día
    const parts = value.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validar rango de año (1900-2100)
    if (year < 1900 || year > 2100) {
      return false;
    }

    // Validar rango de mes (1-12)
    if (month < 1 || month > 12) {
      return false;
    }

    // Validar rango de día según el mes
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return false;
    }

    // Validar que la fecha sea válida usando Date
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La fecha debe estar en formato YYYY-MM-DD y ser una fecha válida (ej: 2025-12-23)';
  }
}

/**
 * Decorador para validar formato de fecha YYYY-MM-DD
 * @param validationOptions Opciones de validación
 */
export function IsDateFormat(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateFormatConstraint,
    });
  };
}

