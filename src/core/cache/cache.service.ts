import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Buscar do cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await this.cacheManager.get<T>(key);
      if (result) {
        this.logger.debug(`Cache HIT: ${key}`, { module: 'CacheService', method: 'get' });
      } else {
        this.logger.debug(`Cache MISS: ${key}`, { module: 'CacheService', method: 'get' });
      }
      return result;
    } catch (error) {
      this.logger.warn(`Erro ao buscar cache: ${key}`, { module: 'CacheService', method: 'get', error: error.message });
      return undefined;
    }
  }

  /**
   * Salvar no cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'})`, { module: 'CacheService', method: 'set' });
    } catch (error) {
      this.logger.warn(`Erro ao definir cache: ${key}`, { module: 'CacheService', method: 'set', error: error.message });
    }
  }

  /**
   * Deletar do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`, { module: 'CacheService', method: 'del' });
    } catch (error) {
      this.logger.warn(`Erro ao remover cache: ${key}`, { module: 'CacheService', method: 'del', error: error.message });
    }
  }

  /**
   * Limpar todo o cache
   */
  async reset(): Promise<void> {
    try {
      // O cache-manager v5 usa store.reset() se disponível
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
        this.logger.log('Cache completamente limpo', { module: 'CacheService', method: 'reset' });
      } else {
        // Fallback: não há método reset disponível
        this.logger.warn('Reset não disponível neste cache store - use invalidateKeys para chaves específicas', {
          module: 'CacheService',
          method: 'reset',
        });
      }
    } catch (error) {
      this.logger.warn('Erro ao limpar cache', { module: 'CacheService', method: 'reset', error: error.message });
    }
  }

  /**
   * Padrão cache-aside - buscar ou executar função
   */
  async getOrSet<T>(key: string, fetchFunction: () => Promise<T>, ttl = 300000): Promise<T> {
    try {
      let data = await this.get<T>(key);

      if (!data) {
        data = await fetchFunction();
        await this.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      this.logger.warn(`Erro no getOrSet para ${key}`, { module: 'CacheService', method: 'getOrSet', error: error.message });
      return await fetchFunction(); // Fallback para busca direta
    }
  }

  /**
   * Invalidar múltiplas chaves conhecidas
   */
  async invalidateKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.del(key);
    }
  }

  /**
   * Gerar chave de cache baseada no usuário
   */
  generateUserKey(userId: string, resource: string, params?: any): string {
    const paramStr = params ? `:${Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 10)}` : '';
    return `user:${userId}:${resource}${paramStr}`;
  }
}
