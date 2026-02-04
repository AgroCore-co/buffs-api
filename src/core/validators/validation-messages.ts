/**
 * Mensagens de validação padronizadas para toda a aplicação.
 * Centraliza as mensagens para manter consistência e facilitar manutenção.
 */

export const ValidationMessages = {
  // Tipos básicos
  STRING: 'Deve ser um texto',
  NUMBER: 'Deve ser um número',
  INTEGER: 'Deve ser um número inteiro',
  BOOLEAN: 'Deve ser verdadeiro ou falso',

  // Required/Optional
  REQUIRED: (field: string) => `${field} é obrigatório`,

  // IDs
  UUID: 'O ID deve ser um UUID válido',
  UUID_FIELD: (field: string) => `O ${field} deve ser um UUID válido`,

  // Datas
  DATE_ISO: 'A data deve estar no formato ISO 8601 válido',
  DATE_VALID: 'Deve ser uma data válida',
  DATE_NOT_FUTURE: 'A data não pode estar no futuro',
  DATE_FIELD_ISO: (field: string) => `A ${field} deve estar no formato ISO 8601 válido`,
  DATE_FIELD_NOT_FUTURE: (field: string) => `A ${field} não pode estar no futuro`,

  // Constraints de tamanho
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH_FIELD: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
  MIN_LENGTH_FIELD: (field: string, min: number) => `${field} deve ter pelo menos ${min} caracteres`,

  // Constraints numéricas
  MIN: (min: number) => `Deve ser maior ou igual a ${min}`,
  MAX: (max: number) => `Deve ser menor ou igual a ${max}`,
  POSITIVE: 'Deve ser um número positivo',
  MIN_FIELD: (field: string, min: number) => `${field} deve ser maior ou igual a ${min}`,
  MAX_FIELD: (field: string, max: number) => `${field} deve ser menor ou igual a ${max}`,

  // Padrões específicos
  EMAIL: 'Email inválido',
  PHONE: 'Telefone deve conter 10 ou 11 dígitos',

  // Enums
  ENUM: (values: string[]) => `Deve ser um dos valores: ${values.join(', ')}`,
  ENUM_FIELD: (field: string, values: string[]) => `${field} deve ser um dos valores: ${values.join(', ')}`,
} as const;
