import { CategoriaABCB } from '../dto/categoria-abcb.dto';
import { ArvoreGenealogicaDto } from '../../../reproducao/genealogia/dto';

export class CategoriaABCBUtil {
  /**
   * Calcula categoria ABCB baseada na genealogia e propriedade ABCB
   *
   * @param arvoreGenealogica Árvore genealógica do animal
   * @param propriedadeParticipaABCB Se a propriedade participa da ABCB
   * @returns Categoria ABCB do animal
   */
  static calcularCategoria(arvoreGenealogica: ArvoreGenealogicaDto, propriedadeParticipaABCB: boolean): CategoriaABCB {
    // 1. Se propriedade não participa da ABCB, sempre SRD
    if (!propriedadeParticipaABCB) {
      return CategoriaABCB.SRD;
    }

    const racaAnimal = arvoreGenealogica.idRaca;

    // 2. Se não tem raça definida, é SRD
    if (!racaAnimal) {
      return CategoriaABCB.SRD;
    }

    // 3. Se tem raça definida, mas NÃO TEM pais (animal base, "fundação")
    //    Esta é a definição de Puro por Absorção (PA).
    if (!arvoreGenealogica.pai && !arvoreGenealogica.mae) {
      return CategoriaABCB.PA;
    }

    // --- Daqui para baixo, o animal TEM raça E TEM pais (ou pelo menos um) ---

    // 4. Verifica 4 gerações puras para PO
    //    (animal + pais + avós + bisavós)
    if (this.verificarPurezaRecursiva(arvoreGenealogica, racaAnimal, 4)) {
      return CategoriaABCB.PO;
    }

    // 5. Verifica 3 gerações puras para PC
    //    (animal + pais + avós)
    if (this.verificarPurezaRecursiva(arvoreGenealogica, racaAnimal, 3)) {
      return CategoriaABCB.PC;
    }

    // 6. Se tem pais (passou da verificação 3), mas não é PO nem PC,
    //    ele se enquadra como Controle de Cruzamento e Genealogia (CCG).
    //    Isso captura tanto mestiços (ex: pai Murrah, mãe Jafarabadi)
    //    quanto puros em progresso (ex: 7/8 Murrah).
    return CategoriaABCB.CCG;
  }

  /**
   * Verifica recursivamente se um animal e seus ancestrais
   * são da mesma raça e possuem genealogia completa
   * até N níveis de profundidade.
   *
   * @param arvore O nó do animal atual
   * @param racaAlvo A raça que todos devem ter
   * @param niveisRestantes Quantos níveis de gerações (incluindo este) ainda faltam verificar.
   *                        Para PO (4 gerações), chama-se com niveisRestantes = 4.
   * @returns true se o animal e seus ancestrais atendem aos critérios de pureza
   */
  private static verificarPurezaRecursiva(arvore: ArvoreGenealogicaDto | null | undefined, racaAlvo: string, niveisRestantes: number): boolean {
    // 1. Caso Base de Sucesso: Verificamos todos os níveis necessários.
    if (niveisRestantes === 0) {
      return true;
    }

    // 2. Caso de Falha: Nó não existe ou não é da raça alvo.
    if (!arvore?.idRaca || arvore.idRaca !== racaAlvo) {
      return false;
    }

    // 3. Caso de Falha: Precisamos verificar mais fundo (niveis > 1),
    //    mas este nó não tem pais (genealogia incompleta).
    if (niveisRestantes > 1 && (!arvore.pai || !arvore.mae)) {
      return false;
    }

    // 4. Chamada Recursiva:
    //    Verifica este nível (já feito) e desce para os pais,
    //    decrementando o nível.
    return (
      this.verificarPurezaRecursiva(arvore.pai, racaAlvo, niveisRestantes - 1) &&
      this.verificarPurezaRecursiva(arvore.mae, racaAlvo, niveisRestantes - 1)
    );
  }
}
