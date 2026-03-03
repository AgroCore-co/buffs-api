import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CacheService, CacheTTL, CacheKeys } from '../cache';
import { UsuarioRepositoryDrizzle } from '../../modules/usuario/repositories/usuario.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from '../../modules/usuario/repositories/usuario-propriedade.repository.drizzle';
import { PropriedadeRepositoryHelper } from '../../modules/usuario/repositories/helper/propriedade.repository.helper';

/**
 * Serviço centralizado para lógica de autenticação e autorização
 * Elimina duplicação de código entre os serviços que precisam verificar
 * usuário autenticado e suas propriedades associadas.
 *
 * @class AuthHelperService
 */
@Injectable()
export class AuthHelperService {
  private readonly logger = new Logger(AuthHelperService.name);

  constructor(
    private readonly usuarioRepository: UsuarioRepositoryDrizzle,
    private readonly usuarioPropriedadeRepository: UsuarioPropriedadeRepositoryDrizzle,
    private readonly propriedadeHelper: PropriedadeRepositoryHelper,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Obtém ID do usuário a partir do email do token JWT.
   * Busca o perfil do usuário no banco de dados.
   *
   * @param user - Objeto do usuário extraído do token JWT (contém email)
   * @returns ID do usuário
   * @throws NotFoundException se o perfil não for encontrado
   */
  async getUserId(user: { email?: string }): Promise<string> {
    if (!user?.email) {
      throw new NotFoundException('Email do usuário não encontrado no token.');
    }

    const perfilUsuario = await this.usuarioRepository.buscarPorEmail(user.email);

    if (!perfilUsuario) {
      this.logger.warn(`Perfil de usuário não encontrado para email: ${user.email}`);
      throw new NotFoundException('Perfil de usuário não encontrado.');
    }

    return perfilUsuario.idUsuario;
  }

  /**
   * Busca todas as propriedades vinculadas ao usuário (como dono OU funcionário).
   * Implementa cache de curta duração para melhor performance.
   *
   * @param userId - ID do usuário
   * @returns Array de IDs das propriedades vinculadas
   * @throws NotFoundException se o usuário não estiver associado a nenhuma propriedade
   */
  async getUserPropriedades(userId: string): Promise<string[]> {
    const cacheKey = CacheKeys.userProperties(userId);

    // 1. Tenta pegar do cache
    const cachedProps = await this.cacheService.get<string[]>(cacheKey);
    if (cachedProps) {
      this.logger.debug(`Propriedades recuperadas do cache para usuário: ${userId}`);
      return cachedProps;
    }

    // 2. Se não tiver no cache, busca no banco
    const propriedadesComoDono = await this.propriedadeHelper.listarPorDono(userId);
    const propriedadesComoFuncionario = await this.usuarioPropriedadeRepository.listarPropriedadesPorUsuario(userId);

    // 3. Combina ambas as listas
    const todasPropriedades = [...propriedadesComoDono, ...propriedadesComoFuncionario];

    // Remove duplicatas e filtra nulls
    const propriedadesUnicas = Array.from(new Set(todasPropriedades.filter((id): id is string => id !== null)));

    if (propriedadesUnicas.length === 0) {
      this.logger.warn(`Usuário ${userId} não está associado a nenhuma propriedade`);
      throw new NotFoundException('Usuário não está associado a nenhuma propriedade.');
    }

    // 4. Cache de curta duração (equilíbrio entre performance e segurança)
    await this.cacheService.set(cacheKey, propriedadesUnicas, CacheTTL.SHORT);
    this.logger.log(`Propriedades carregadas e cacheadas para usuário: ${userId}`);

    return propriedadesUnicas;
  }

  /**
   * Invalida cache de propriedades do usuário.
   * Deve ser chamado quando usuário é vinculado/desvinculado de propriedades.
   *
   * @param userId - ID do usuário
   */
  async invalidarCachePropriedades(userId: string): Promise<void> {
    const cacheKey = CacheKeys.userProperties(userId);
    await this.cacheService.del(cacheKey);
    this.logger.log(`Cache de propriedades invalidado para usuário: ${userId}`);
  }

  /**
   * Valida se o usuário tem acesso a uma propriedade específica.
   *
   * @param userId - ID do usuário
   * @param propriedadeId - ID da propriedade a validar
   * @returns true se o usuário tem acesso, false caso contrário
   */
  async hasAccessToPropriedade(userId: string, propriedadeId: string): Promise<boolean> {
    const propriedadesUsuario = await this.getUserPropriedades(userId);
    return propriedadesUsuario.includes(propriedadeId);
  }

  /**
   * Valida se o usuário tem acesso a uma propriedade e lança exceção caso não tenha.
   *
   * @param userId - ID do usuário
   * @param propriedadeId - ID da propriedade a validar
   * @throws NotFoundException se o usuário não tiver acesso à propriedade
   */
  async validatePropriedadeAccess(userId: string, propriedadeId: string): Promise<void> {
    const hasAccess = await this.hasAccessToPropriedade(userId, propriedadeId);
    if (!hasAccess) {
      this.logger.warn(`Acesso negado: usuário ${userId} tentou acessar propriedade ${propriedadeId}`);
      throw new NotFoundException('Você não tem acesso a esta propriedade.');
    }
  }
}
