import { NivelMaturidade, SexoBufalo } from '../dto/create-bufalo.dto';

export class BufaloMaturityUtils {
  /**
   * Calcula a idade do búfalo em meses baseada na data de nascimento
   */
  static calculateAgeInMonths(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    const yearDiff = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    return yearDiff * 12 + monthDiff;
  }

  /**
   * Calcula a idade do búfalo em anos baseada na data de nascimento
   */
  static calculateAgeInYears(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Determina o nível de maturidade baseado na idade e sexo do búfalo
   * Baseado nas regras:
   * - Bezerro: 0-12 meses
   * - Novilho/Novilha: 12-24 meses (fêmeas) / 12-18 meses (machos castrados)
   * - Vaca: após primeira cria (geralmente 3 anos)
   * - Touro: machos reprodutores a partir de 24 meses
   */
  static determineMaturityLevel(birthDate: Date, sexo: SexoBufalo, hasOffspring = false): NivelMaturidade {
    const ageInMonths = this.calculateAgeInMonths(birthDate);

    // Bezerro: 0-12 meses
    if (ageInMonths < 12) {
      return NivelMaturidade.BEZERRO;
    }

    // Novilho/Novilha: 12-24 meses
    if (ageInMonths < 24) {
      return NivelMaturidade.NOVILHO_NOVILHA;
    }

    // Para fêmeas: se tem descendentes, é vaca; senão, ainda é novilha até os 36 meses
    if (sexo === SexoBufalo.FEMEA) {
      if (hasOffspring || ageInMonths >= 36) {
        return NivelMaturidade.VACA;
      }
      return NivelMaturidade.NOVILHO_NOVILHA;
    }

    // Para machos: se tem descendentes ou é reprodutor, é touro
    if (sexo === SexoBufalo.MACHO) {
      if (hasOffspring || ageInMonths >= 24) {
        return NivelMaturidade.TOURO;
      }
      return NivelMaturidade.NOVILHO_NOVILHA;
    }

    return NivelMaturidade.NOVILHO_NOVILHA;
  }

  /**
   * Valida se a idade do búfalo é válida (não pode ter mais de 50 anos)
   */
  static validateAge(birthDate: Date): boolean {
    const ageInYears = this.calculateAgeInYears(birthDate);
    return ageInYears <= 50;
  }

  /**
   * Verifica se o búfalo deve ter status inativo devido à idade
   */
  static shouldBeInactive(birthDate: Date): boolean {
    return !this.validateAge(birthDate);
  }

  /**
   * Obtém informações detalhadas sobre a maturidade do búfalo
   */
  static getMaturityInfo(birthDate: Date, sexo: SexoBufalo, hasOffspring = false) {
    const ageInMonths = this.calculateAgeInMonths(birthDate);
    const ageInYears = this.calculateAgeInYears(birthDate);
    const maturityLevel = this.determineMaturityLevel(birthDate, sexo, hasOffspring);
    const isValidAge = this.validateAge(birthDate);

    return {
      ageInMonths,
      ageInYears,
      maturityLevel,
      isValidAge,
      shouldBeInactive: !isValidAge,
      description: this.getMaturityDescription(maturityLevel, sexo, ageInMonths),
    };
  }

  /**
   * Retorna uma descrição detalhada do nível de maturidade
   */
  private static getMaturityDescription(maturityLevel: NivelMaturidade, sexo: SexoBufalo, ageInMonths: number): string {
    switch (maturityLevel) {
      case NivelMaturidade.BEZERRO:
        return `Bezerro(a) - ${ageInMonths} meses de idade`;

      case NivelMaturidade.NOVILHO_NOVILHA:
        if (sexo === SexoBufalo.FEMEA) {
          return `Novilha - ${ageInMonths} meses de idade. Puberdade entre 18-30 meses`;
        } else {
          return `Novilho - ${ageInMonths} meses de idade. Castração comum entre 12-18 meses`;
        }

      case NivelMaturidade.VACA:
        return `Vaca - ${ageInMonths} meses de idade. Vida reprodutiva ativa`;

      case NivelMaturidade.TOURO:
        return `Touro - ${ageInMonths} meses de idade. Reprodutor ativo`;

      default:
        return 'Nível de maturidade não definido';
    }
  }
}
