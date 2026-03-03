import { Transform } from 'class-transformer';

/**
 * Decorator que converte strings "true"/"false" para boolean de forma confiável
 * Funciona mesmo com enableImplicitConversion ativo no ValidationPipe
 */
export function ToBoolean() {
  return Transform(
    ({ value, obj, key }: { value: unknown; obj: Record<string, unknown>; key: string }) => {
      // IMPORTANTE: usar obj[key] ao invés de value porque enableImplicitConversion
      // converte o value antes do Transform executar
      const rawValue = obj?.[key] ?? value;

      if (rawValue === undefined || rawValue === null || rawValue === '') {
        return undefined;
      }

      // Se já é boolean, retorna
      if (typeof rawValue === 'boolean') {
        return rawValue;
      }

      // Converte string para boolean
      const strValue = String(rawValue).toLowerCase().trim();

      if (strValue === 'true' || strValue === '1') {
        return true;
      }

      if (strValue === 'false' || strValue === '0') {
        return false;
      }

      return undefined;
    },
    { toPlainOnly: false },
  );
}
