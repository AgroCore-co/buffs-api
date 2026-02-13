export class BufaloValidationUtils {
  /**
   * Valida se a idade do búfalo é válida (não pode ter mais de 50 anos)
   */
  static validateMaxAge(birthDate: Date): boolean {
    if (!birthDate) return true; // Se não há data, deixa outras validações tratarem

    const now = new Date();
    const birth = new Date(birthDate);

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return age <= 50;
  }

  /**
   * Valida se a data de nascimento não é no futuro
   */
  static validateBirthDateNotInFuture(birthDate: Date): boolean {
    if (!birthDate) return true;

    const now = new Date();
    const birth = new Date(birthDate);

    return birth <= now;
  }

  /**
   * Valida se o búfalo tem idade mínima para reprodução
   */
  static validateMinimumBreedingAge(birthDate: Date, sexo: 'M' | 'F'): boolean {
    if (!birthDate) return false;

    const ageInMonths = this.calculateAgeInMonths(birthDate);

    if (sexo === 'F') {
      return ageInMonths >= 18; // Fêmeas: puberdade entre 18-30 meses
    } else {
      return ageInMonths >= 24; // Machos: maturidade sexual a partir de 24 meses
    }
  }

  /**
   * Valida se o intervalo entre datas é razoável
   */
  static validateDateInterval(startDate: Date, endDate: Date, minDays = 0, maxDays = 3650): boolean {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) return false;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= minDays && diffDays <= maxDays;
  }

  /**
   * Valida se o nome do búfalo é válido
   */
  static validateName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;

    // Nome deve ter entre 2 e 50 caracteres
    if (name.length < 2 || name.length > 50) return false;

    // Nome deve conter apenas letras, números, espaços e alguns caracteres especiais
    const nameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/;
    return nameRegex.test(name);
  }

  /**
   * Valida se o brinco é válido
   */
  static validateBrinco(brinco: string): boolean {
    if (!brinco) return true; // Brinco é opcional

    // Brinco deve ter entre 3 e 10 caracteres
    if (brinco.length < 3 || brinco.length > 10) return false;

    // Brinco deve conter apenas letras, números e hífens
    const brincoRegex = /^[A-Z0-9\-]+$/;
    return brincoRegex.test(brinco);
  }

  /**
   * Valida se o microchip é válido
   */
  static validateMicrochip(microchip: string): boolean {
    if (!microchip) return true; // Microchip é opcional

    // Microchip deve ter entre 10 e 30 caracteres
    if (microchip.length < 10 || microchip.length > 30) return false;

    // Microchip deve conter apenas números
    const microchipRegex = /^[0-9]+$/;
    return microchipRegex.test(microchip);
  }

  /**
   * Calcula a idade em meses (método auxiliar para validações)
   */
  private static calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    const yearDiff = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    return yearDiff * 12 + monthDiff;
  }
}
