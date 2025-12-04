import { customType } from 'drizzle-orm/pg-core';

/**
 * Tipo customizado para geometria PostGIS
 *
 * No PostgreSQL com PostGIS, o tipo geometry é armazenado de forma nativa.
 * No Drizzle, tratamos como string para permitir manipulação de GeoJSON.
 *
 * Uso: geometry('nome_coluna')
 *
 * Exemplo de valor GeoJSON:
 * {
 *   "type": "Polygon",
 *   "coordinates": [[[-47.5, -24.5], [-47.4, -24.5], [-47.4, -24.4], [-47.5, -24.4], [-47.5, -24.5]]]
 * }
 */
export const geometry = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'geometry';
  },
  toDriver(value: string): string {
    // Se já é string (WKT ou GeoJSON string), retorna direto
    if (typeof value === 'string') {
      return value;
    }
    // Se é objeto GeoJSON, converte para string
    return JSON.stringify(value);
  },
  fromDriver(value: string): string {
    // PostGIS retorna como string, mantemos assim
    return value;
  },
});
