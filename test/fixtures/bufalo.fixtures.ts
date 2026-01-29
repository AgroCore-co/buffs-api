/**
 * Fixtures para testes E2E de Búfalos
 *
 * Dados de teste reutilizáveis e consistentes
 */

export const BufaloFixtures = {
  /**
   * Búfalo macho válido para criação
   */
  validMacho: (idPropriedade: string, idRaca: string) => ({
    nome: 'Valente E2E',
    sexo: 'M' as const,
    dt_nascimento: '2020-01-15',
    id_propriedade: idPropriedade,
    id_raca: idRaca,
    brinco: 'E2E-001',
    microchip: '982000123456789',
  }),

  /**
   * Búfala fêmea válida para criação
   */
  validFemea: (idPropriedade: string, idRaca: string) => ({
    nome: 'Princesa E2E',
    sexo: 'F' as const,
    dt_nascimento: '2019-06-20',
    id_propriedade: idPropriedade,
    id_raca: idRaca,
    brinco: 'E2E-002',
  }),

  /**
   * Bezerro (0-12 meses) - deve ter maturidade 'B'
   */
  bezerro: (idPropriedade: string, idRaca: string) => {
    const hoje = new Date();
    const nascimento = new Date(hoje);
    nascimento.setMonth(nascimento.getMonth() - 6); // 6 meses atrás

    return {
      nome: 'Bezerro E2E',
      sexo: 'M' as const,
      dt_nascimento: nascimento.toISOString().split('T')[0],
      id_propriedade: idPropriedade,
      id_raca: idRaca,
    };
  },

  /**
   * Novilho (12-24 meses macho) - deve ter maturidade 'N'
   */
  novilho: (idPropriedade: string, idRaca: string) => {
    const hoje = new Date();
    const nascimento = new Date(hoje);
    nascimento.setMonth(nascimento.getMonth() - 18); // 18 meses atrás

    return {
      nome: 'Novilho E2E',
      sexo: 'M' as const,
      dt_nascimento: nascimento.toISOString().split('T')[0],
      id_propriedade: idPropriedade,
      id_raca: idRaca,
    };
  },

  /**
   * Touro (24+ meses macho) - deve ter maturidade 'T'
   */
  touro: (idPropriedade: string, idRaca: string) => {
    const hoje = new Date();
    const nascimento = new Date(hoje);
    nascimento.setFullYear(nascimento.getFullYear() - 3); // 3 anos atrás

    return {
      nome: 'Touro E2E',
      sexo: 'M' as const,
      dt_nascimento: nascimento.toISOString().split('T')[0],
      id_propriedade: idPropriedade,
      id_raca: idRaca,
    };
  },

  /**
   * Vaca (36+ meses fêmea) - deve ter maturidade 'V'
   */
  vaca: (idPropriedade: string, idRaca: string) => {
    const hoje = new Date();
    const nascimento = new Date(hoje);
    nascimento.setFullYear(nascimento.getFullYear() - 4); // 4 anos atrás

    return {
      nome: 'Vaca E2E',
      sexo: 'F' as const,
      dt_nascimento: nascimento.toISOString().split('T')[0],
      id_propriedade: idPropriedade,
      id_raca: idRaca,
    };
  },

  /**
   * Búfalo com dados inválidos (nome vazio)
   */
  invalidNomeVazio: (idPropriedade: string, idRaca: string) => ({
    nome: '',
    sexo: 'M' as const,
    dt_nascimento: '2020-01-01',
    id_propriedade: idPropriedade,
    id_raca: idRaca,
  }),

  /**
   * Búfalo com sexo inválido
   */
  invalidSexo: (idPropriedade: string, idRaca: string) => ({
    nome: 'Teste Inválido',
    sexo: 'X' as any,
    dt_nascimento: '2020-01-01',
    id_propriedade: idPropriedade,
    id_raca: idRaca,
  }),

  /**
   * Búfalo com data de nascimento no futuro
   */
  invalidDataFutura: (idPropriedade: string, idRaca: string) => {
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);

    return {
      nome: 'Teste Futuro',
      sexo: 'M' as const,
      dt_nascimento: futuro.toISOString().split('T')[0],
      id_propriedade: idPropriedade,
      id_raca: idRaca,
    };
  },
};
