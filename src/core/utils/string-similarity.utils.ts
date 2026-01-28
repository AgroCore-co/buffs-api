import { distance } from 'fastest-levenshtein';

/**
 * Utilitários para comparação e agrupamento de strings similares
 * Usado para detectar erros de digitação em nomes de doenças
 */
export class StringSimilarityUtil {
  /**
   * Calcula a distância de Levenshtein entre duas strings
   * Retorna o número de edições necessárias para transformar s1 em s2
   * @param s1 Primeira string
   * @param s2 Segunda string
   * @returns Número de edições (inserções, remoções, substituições)
   */
  static levenshteinDistance(s1: string, s2: string): number {
    return distance(s1, s2);
  }

  /**
   * Verifica se duas strings são similares baseado em um limiar
   * @param s1 Primeira string
   * @param s2 Segunda string
   * @param threshold Limiar de similaridade (0-1, padrão 0.8)
   * @returns true se as strings são similares
   */
  static areSimilar(s1: string, s2: string, threshold = 0.8): boolean {
    if (!s1 || !s2) return false;
    if (s1 === s2) return true;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= threshold;
  }

  /**
   * Agrupa strings similares em grupos
   * @param strings Array de strings para agrupar
   * @param threshold Limiar de similaridade (0-1, padrão 0.8)
   * @returns Map onde a chave é o representante do grupo e o valor é o array de strings similares
   */
  static groupSimilarStrings(strings: string[], threshold = 0.8): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    const processed = new Set<string>();

    strings.forEach((str1) => {
      if (processed.has(str1)) return;

      const group = [str1];
      processed.add(str1);

      strings.forEach((str2) => {
        if (str1 !== str2 && !processed.has(str2)) {
          if (this.areSimilar(str1, str2, threshold)) {
            group.push(str2);
            processed.add(str2);
          }
        }
      });

      groups.set(str1, group);
    });

    return groups;
  }
}
