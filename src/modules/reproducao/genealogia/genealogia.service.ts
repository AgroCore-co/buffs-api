import { Injectable, NotFoundException } from '@nestjs/common';
import { GenealogiaNodeDto } from './dto/genealogia-response.dto';
import { GenealogiaRepositoryDrizzle } from './repositories/genealogia.repository.drizzle';

export interface ArvoreGenealogicaNode {
  id_bufalo: string;
  id_raca: string | null;
  categoria: string | null;
  nome?: string;
  pai?: ArvoreGenealogicaNode | null;
  mae?: ArvoreGenealogicaNode | null;
  geracao: number;
}

@Injectable()
export class GenealogiaService {
  constructor(private readonly genealogiaRepo: GenealogiaRepositoryDrizzle) {}

  public async buildTree(id: string, maxDepth: number, user: any): Promise<GenealogiaNodeDto | null> {
    try {
      // Verifica se o usuário tem acesso ao búfalo
      await this.verificarAcessoBufalo(id, user);

      // Constrói a árvore completa
      const arvoreCompleta = await this.construirArvoreCompleta(id, maxDepth);

      if (!arvoreCompleta) return null;

      // Converte para o formato do DTO de resposta
      return this.converterParaGenealogiaNode(arvoreCompleta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Verifica se o usuário tem acesso ao búfalo
   */
  private async verificarAcessoBufalo(bufaloId: string, user: any): Promise<void> {
    const userId = await this.getUserId(user);
    const propriedadesUsuario = await this.getUserPropriedades(userId);

    const temAcesso = await this.genealogiaRepo.verificarPropriedadeUsuario(bufaloId, propriedadesUsuario);

    if (!temAcesso) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado ou não pertence a este usuário.`);
    }
  }

  /**
   * Obter ID do usuário baseado no email
   */
  private async getUserId(user: any): Promise<string> {
    const perfilUsuario = await this.genealogiaRepo.buscarUsuarioPorEmail(user.email);

    if (!perfilUsuario) {
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }
    return perfilUsuario.idUsuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário
   */
  private async getUserPropriedades(userId: string): Promise<string[]> {
    const propriedadesComoDono = await this.genealogiaRepo.buscarPropriedadesComoDono(userId);
    const propriedadesComoFuncionario = await this.genealogiaRepo.buscarPropriedadesComoFuncionario(userId);

    const todasPropriedades = [...propriedadesComoDono.map((p) => p.idPropriedade), ...propriedadesComoFuncionario.map((p) => p.idPropriedade)];

    const propriedadesUnicas = Array.from(new Set(todasPropriedades.filter((id): id is string => id !== null)));

    if (propriedadesUnicas.length === 0) {
      throw new NotFoundException('Usuário não está associado a nenhuma propriedade.');
    }

    return propriedadesUnicas;
  }

  /**
   * Constrói árvore genealógica completa com informações detalhadas
   * Usado pelo módulo de reprodução para visualização
   */
  async construirArvoreCompleta(bufaloId: string, geracoes: number = 4): Promise<any> {
    const bufalo = await this.genealogiaRepo.findBufaloById(bufaloId);

    if (!bufalo) return null;

    const arvore = {
      id_bufalo: bufalo.idBufalo,
      nome: bufalo.nome,
      brinco: bufalo.brinco,
      sexo: bufalo.sexo,
      dt_nascimento: bufalo.dtNascimento,
      id_raca: bufalo.idRaca,
      categoria: bufalo.categoria,
      raca: bufalo.raca?.nome,
      pai: null,
      mae: null,
    };

    // Busca pai e mãe recursivamente em PARALELO se ainda não atingiu o limite
    if (geracoes > 1) {
      const [pai, mae] = await Promise.all([
        bufalo.idPai ? this.construirArvoreCompleta(bufalo.idPai, geracoes - 1) : Promise.resolve(null),
        bufalo.idMae ? this.construirArvoreCompleta(bufalo.idMae, geracoes - 1) : Promise.resolve(null),
      ]);

      arvore.pai = pai;
      arvore.mae = mae;
    }

    return arvore;
  }

  /**
   * Constrói árvore genealógica simplificada para cálculo de categoria ABCB
   * Usado pelo módulo de rebanho para categorização
   */
  async construirArvoreParaCategoria(bufaloId: string, geracao: number = 1): Promise<ArvoreGenealogicaNode | null> {
    const bufalo = await this.genealogiaRepo.findBufaloWithParents(bufaloId);

    if (!bufalo) return null;

    const arvore: ArvoreGenealogicaNode = {
      id_bufalo: bufalo.idBufalo,
      id_raca: bufalo.idRaca,
      categoria: bufalo.categoria,
      geracao,
      pai: null,
      mae: null,
    };

    // Busca pai e mãe se necessário (até 4 gerações) em PARALELO
    if (geracao <= 4) {
      const [pai, mae] = await Promise.all([
        bufalo.idPai ? this.construirArvoreParaCategoria(bufalo.idPai, geracao + 1) : Promise.resolve(null),
        bufalo.idMae ? this.construirArvoreParaCategoria(bufalo.idMae, geracao + 1) : Promise.resolve(null),
      ]);

      arvore.pai = pai;
      arvore.mae = mae;
    }

    return arvore;
  }

  /**
   * Constrói árvore genealógica a partir de dados fornecidos (sem buscar o búfalo no banco).
   * Útil para calcular categoria ABCB durante a criação de um novo búfalo.
   *
   * @param idRaca ID da raça do búfalo
   * @param idPai ID do pai (opcional)
   * @param idMae ID da mãe (opcional)
   * @param geracao Geração atual (padrão: 1)
   * @returns Árvore genealógica construída a partir dos pais
   */
  async construirArvoreParaCategoriaFromData(
    idRaca: string | null,
    idPai: string | null | undefined,
    idMae: string | null | undefined,
    geracao: number = 1,
  ): Promise<ArvoreGenealogicaNode | null> {
    // Cria o nó raiz com os dados fornecidos
    const arvore: ArvoreGenealogicaNode = {
      id_bufalo: 'temp', // ID temporário (não será usado para queries)
      id_raca: idRaca,
      categoria: null, // Será calculado posteriormente
      geracao,
      pai: null,
      mae: null,
    };

    // Busca pai e mãe se necessário (até 4 gerações) em PARALELO
    if (geracao <= 4) {
      const [pai, mae] = await Promise.all([
        idPai ? this.construirArvoreParaCategoria(idPai, geracao + 1) : Promise.resolve(null),
        idMae ? this.construirArvoreParaCategoria(idMae, geracao + 1) : Promise.resolve(null),
      ]);

      arvore.pai = pai;
      arvore.mae = mae;
    }

    return arvore;
  }

  /**
   * Verifica se um búfalo tem descendentes
   */
  async verificarSeTemDescendentes(bufaloId: string): Promise<boolean> {
    return await this.genealogiaRepo.verificarDescendentes(bufaloId);
  }

  /**
   * Converte árvore completa para o formato do DTO de genealogia
   */
  private converterParaGenealogiaNode(arvore: any): GenealogiaNodeDto {
    const node: GenealogiaNodeDto = {
      id: arvore.id_bufalo,
      nome: arvore.nome,
    };

    if (arvore.pai) {
      node.pai = this.converterParaGenealogiaNode(arvore.pai);
    }

    if (arvore.mae) {
      node.mae = this.converterParaGenealogiaNode(arvore.mae);
    }

    return node;
  }
}
