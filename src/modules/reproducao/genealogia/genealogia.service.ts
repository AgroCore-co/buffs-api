import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GenealogiaNodeDto, ArvoreGenealogicaDto } from './dto';
import { GenealogiaRepositoryDrizzle } from './repositories/genealogia.repository.drizzle';
import { UserMappingService } from '../../../core/services/user-mapping.service';
import { UsuarioPropriedadeRepositoryDrizzle } from '../../usuario/repositories/usuario-propriedade.repository.drizzle';
import { PropriedadeRepositoryHelper } from '../../usuario/repositories/helper/propriedade.repository.helper';

@Injectable()
export class GenealogiaService {
  constructor(
    private readonly genealogiaRepo: GenealogiaRepositoryDrizzle,
    private readonly userMappingService: UserMappingService,
    private readonly usuarioPropriedadeRepo: UsuarioPropriedadeRepositoryDrizzle,
    private readonly propriedadeHelper: PropriedadeRepositoryHelper,
  ) {}

  public async buildTree(id: string, maxDepth: number, user: any): Promise<GenealogiaNodeDto | null> {
    // Verifica se o usuário tem acesso ao búfalo
    await this.verificarAcessoBufalo(id, user);

    // Constrói a árvore completa
    const arvoreCompleta = await this.construirArvoreCompleta(id, maxDepth);

    if (!arvoreCompleta) {
      throw new NotFoundException(`Búfalo com ID ${id} não encontrado.`);
    }

    // Converte para o formato do DTO de resposta
    return this.converterParaGenealogiaNode(arvoreCompleta);
  }

  /**
   * Verifica se o usuário tem acesso ao búfalo
   */
  private async verificarAcessoBufalo(bufaloId: string, user: any): Promise<void> {
    // Obtém ID interno do usuário
    const userId = await this.userMappingService.getInternalUserId(user.sub);

    // Obtém ID da propriedade do búfalo
    const bufaloPropriedadeId = await this.genealogiaRepo.getBufaloPropriedadeId(bufaloId);

    if (!bufaloPropriedadeId) {
      throw new NotFoundException(`Búfalo com ID ${bufaloId} não encontrado.`);
    }

    // Verifica se o usuário é dono da propriedade
    const isDono = await this.propriedadeHelper.pertenceAoDono(bufaloPropriedadeId, userId);

    if (isDono) {
      return; // Usuário é dono, tem acesso
    }

    // Verifica se o usuário é funcionário da propriedade
    const isFuncionario = await this.usuarioPropriedadeRepo.estaVinculado(userId, bufaloPropriedadeId);

    if (!isFuncionario) {
      throw new ForbiddenException(`Você não tem permissão para acessar este búfalo.`);
    }
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
  async construirArvoreParaCategoria(bufaloId: string, geracao: number = 1): Promise<ArvoreGenealogicaDto | null> {
    const bufalo = await this.genealogiaRepo.findBufaloWithParents(bufaloId);

    if (!bufalo) return null;

    const arvore: ArvoreGenealogicaDto = {
      idBufalo: bufalo.idBufalo,
      idRaca: bufalo.idRaca,
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
  ): Promise<ArvoreGenealogicaDto | null> {
    // Cria o nó raiz com os dados fornecidos
    const arvore: ArvoreGenealogicaDto = {
      idBufalo: 'temp', // ID temporário (não será usado para queries)
      idRaca: idRaca,
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
