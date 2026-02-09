import { Injectable, Logger } from '@nestjs/common';
import { CategoriaABCBUtil } from '../utils/categoria-abcb.util';
import { CategoriaABCB } from '../dto/categoria-abcb.dto';
import { ArvoreGenealogicaDto } from '../../../reproducao/genealogia/dto';

/**
 * Serviço de domínio para lógica de categoria ABCB.
 *
 * **Responsabilidades:**
 * - Calcular categoria ABCB baseada em genealogia
 * - Processar dados de categoria antes de salvar
 * - Validar elegibilidade para ABCB
 */
@Injectable()
export class BufaloCategoriaService {
  private readonly logger = new Logger(BufaloCategoriaService.name);

  /**
   * Processa categoria ABCB de um búfalo.
   *
   * **Regras:**
   * - **SRD**: Sem Raça Definida (propriedade não participa ABCB ou sem raça)
   * - **PA**: Puro por Absorção (tem raça mas não tem pais registrados - animal base)
   * - **PO**: Puro de Origem (4 gerações puras completas)
   * - **PC**: Puro por Cruzamento (3 gerações puras completas)
   * - **CCG**: Controle de Cruzamento e Genealogia (tem pais mas não atinge PC/PO)
   *
   * @param arvoreGenealogica Árvore genealógica do animal
   * @param propriedadeParticipaABCB Se a propriedade participa da ABCB
   * @returns Categoria ABCB calculada
   */
  processarCategoriaABCB(arvoreGenealogica: ArvoreGenealogicaDto, propriedadeParticipaABCB: boolean): CategoriaABCB {
    try {
      const categoria = CategoriaABCBUtil.calcularCategoria(arvoreGenealogica, propriedadeParticipaABCB);

      this.logger.debug(`Categoria calculada: ${categoria} (ABCB: ${propriedadeParticipaABCB ? 'Sim' : 'Não'})`);

      return categoria;
    } catch (error) {
      this.logger.error('Erro ao calcular categoria ABCB:', error);
      // Em caso de erro, retorna SRD como fallback seguro
      return CategoriaABCB.SRD;
    }
  }

  /**
   * Verifica se búfalo é elegível para registro ABCB.
   *
   * @param categoria Categoria ABCB do búfalo
   * @returns true se elegível (PO, PC, CCG)
   */
  isElegivelABCB(categoria: CategoriaABCB): boolean {
    return [CategoriaABCB.PO, CategoriaABCB.PC, CategoriaABCB.CCG].includes(categoria);
  }

  /**
   * Obtém descrição detalhada da categoria ABCB.
   *
   * @param categoria Categoria ABCB
   * @returns Descrição da categoria
   */
  obterDescricaoCategoria(categoria: CategoriaABCB): string {
    const descricoes: Record<CategoriaABCB, string> = {
      [CategoriaABCB.SRD]: 'Sem Raça Definida - Não elegível para registro ABCB',
      [CategoriaABCB.PA]: 'Puro por Absorção - Animal fundador sem pais registrados',
      [CategoriaABCB.PO]: 'Puro de Origem - 4 gerações puras completas',
      [CategoriaABCB.PC]: 'Puro por Cruzamento - 3 gerações puras completas',
      [CategoriaABCB.CCG]: 'Controle de Cruzamento e Genealogia - Em progresso para pureza',
    };

    return descricoes[categoria] || 'Categoria desconhecida';
  }

  /**
   * Verifica quantas gerações puras o búfalo possui.
   * Útil para mostrar progresso de pureza.
   *
   * @param arvoreGenealogica Árvore genealógica do animal
   * @returns Número de gerações puras (0-4)
   */
  contarGeracoesPuras(arvoreGenealogica: ArvoreGenealogicaDto): number {
    if (!arvoreGenealogica?.idRaca) {
      return 0;
    }

    const racaAlvo = arvoreGenealogica.idRaca;

    // Verifica nível por nível
    if (!this.verificarNivel(arvoreGenealogica, racaAlvo, 1)) return 0;
    if (!this.verificarNivel(arvoreGenealogica, racaAlvo, 2)) return 1;
    if (!this.verificarNivel(arvoreGenealogica, racaAlvo, 3)) return 2;
    if (!this.verificarNivel(arvoreGenealogica, racaAlvo, 4)) return 3;

    return 4;
  }

  /**
   * Verifica se um nível específico da genealogia é puro.
   *
   * @param arvore Nó da árvore
   * @param racaAlvo Raça esperada
   * @param nivel Nível a verificar (1-4)
   * @returns true se o nível é puro
   */
  private verificarNivel(arvore: ArvoreGenealogicaDto | null | undefined, racaAlvo: string, nivel: number): boolean {
    if (nivel === 0) return true;
    if (!arvore?.idRaca || arvore.idRaca !== racaAlvo) return false;
    if (nivel > 1 && (!arvore.pai || !arvore.mae)) return false;

    return this.verificarNivel(arvore.pai, racaAlvo, nivel - 1) && this.verificarNivel(arvore.mae, racaAlvo, nivel - 1);
  }

  /**
   * Obtém informações detalhadas sobre a categoria do búfalo.
   *
   * @param arvoreGenealogica Árvore genealógica
   * @param propriedadeParticipaABCB Se participa da ABCB
   * @returns Informações completas de categoria
   */
  obterInformacoesCategoria(arvoreGenealogica: ArvoreGenealogicaDto, propriedadeParticipaABCB: boolean) {
    const categoria = this.processarCategoriaABCB(arvoreGenealogica, propriedadeParticipaABCB);
    const geracoesPuras = this.contarGeracoesPuras(arvoreGenealogica);
    const elegivel = this.isElegivelABCB(categoria);
    const descricao = this.obterDescricaoCategoria(categoria);

    return {
      categoria,
      geracoesPuras,
      elegivel,
      descricao,
      propriedadeParticipaABCB,
    };
  }
}
