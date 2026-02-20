/**
 * Utilitários auxiliares para cálculos e determinações de status reprodutivo
 * Funções puras sem dependências externas
 */

/**
 * Calcula a idade de um animal em meses
 *
 * @param dtNascimento - Data de nascimento (ISO string ou Date)
 * @returns Idade em meses
 */
export function calcularIdadeEmMeses(dtNascimento: string | Date): number {
  const hoje = new Date();
  const nascimento = typeof dtNascimento === 'string' ? new Date(dtNascimento) : dtNascimento;

  const anos = hoje.getFullYear() - nascimento.getFullYear();
  const meses = hoje.getMonth() - nascimento.getMonth();

  return anos * 12 + meses;
}

/**
 * Calcula dias decorridos desde uma data específica
 *
 * @param data - Data de referência (ISO string ou Date)
 * @returns Número de dias desde a data
 */
export function calcularDiasDesdeData(data: string | Date): number {
  const dataRef = typeof data === 'string' ? new Date(data) : data;
  return Math.floor((Date.now() - dataRef.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determina o status textual de uma fêmea baseado nos fatores IAR
 *
 * @param fp_prontidao - Fator de Prontidão (0-100)
 * @param numeroCiclos - Número de ciclos/partos
 * @param diasPosParto - Dias pós-parto (null se novilha)
 * @returns Status textual descritivo
 */
export function determinarStatusFemea(fp_prontidao: number, numeroCiclos: number, diasPosParto: number | null): string {
  // Inaptas (FP = 0)
  if (fp_prontidao === 0) {
    if (numeroCiclos === 0) {
      return 'Inapta - Novilha Imatura';
    }
    if (diasPosParto !== null && diasPosParto < 63) {
      return 'Inapta - Aguardando PEV';
    }
    return 'Inapta';
  }

  // Aptas (FP = 100)
  if (fp_prontidao === 100) {
    if (numeroCiclos === 0) {
      return 'Apta (Novilha)';
    }
    return 'Apta (Pós-Parto)';
  }

  // Aptidão parcial (FP entre 0 e 100)
  if (fp_prontidao > 70) {
    return numeroCiclos === 0 ? 'Apta (Novilha)' : 'Apta (Pós-Parto)';
  }

  return 'Aptidão Reduzida - DEA Elevados';
}

/**
 * Formata um número com casas decimais específicas
 *
 * @param valor - Valor numérico
 * @param casasDecimais - Número de casas decimais (padrão: 1)
 * @returns Número formatado
 */
export function formatarNumero(valor: number, casasDecimais = 1): number {
  const multiplicador = Math.pow(10, casasDecimais);
  return Math.round(valor * multiplicador) / multiplicador;
}

/**
 * Valida se uma data está dentro de um intervalo razoável
 *
 * @param data - Data a validar
 * @param mesesMinimo - Meses mínimos no passado (default: -120 = 10 anos)
 * @param mesesMaximo - Meses máximos no futuro (default: 0 = hoje)
 * @returns true se válida
 */
export function validarDataNascimento(data: string | Date, mesesMinimo = -120, mesesMaximo = 0): boolean {
  const dataRef = typeof data === 'string' ? new Date(data) : data;
  const hoje = new Date();

  const dataMinima = new Date();
  dataMinima.setMonth(hoje.getMonth() + mesesMinimo);

  const dataMaxima = new Date();
  dataMaxima.setMonth(hoje.getMonth() + mesesMaximo);

  return dataRef >= dataMinima && dataRef <= dataMaxima;
}
