import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';
import { getErrorMessage } from '../utils/error.utils';

type RedisIncrementClient = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttlSeconds: number) => Promise<number>;
  ttl?: (key: string) => Promise<number>;
};

@Injectable()
export class CacheService {
  private readonly incrementLocks = new Map<string, Promise<void>>();

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
    } catch (error: unknown) {
      this.logger.warn(`Erro ao buscar cache: ${key}`, { module: 'CacheService', method: 'get', error: getErrorMessage(error) });
      return undefined;
    }
  }

  /**
   * Salvar no cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl ?? 'default'})`, { module: 'CacheService', method: 'set' });
    } catch (error: unknown) {
      this.logger.warn(`Erro ao definir cache: ${key}`, { module: 'CacheService', method: 'set', error: getErrorMessage(error) });
    }
  }

  /**
   * Incrementa um contador com atomicidade quando há backend Redis.
   * Define TTL na primeira escrita para preservar janela deslizante de rate limit.
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    try {
      const redisClient = this.resolveRedisIncrementClient();

      if (!redisClient) {
        // Fallback com lock local por chave (atômico apenas neste processo).
        return await this.withIncrementLock(key, async () => {
          const current = (await this.get<number>(key)) ?? 0;
          const next = current + 1;
          await this.set(key, next, ttlSeconds * 1000);
          this.logger.warn(`Store sem INCR nativo para chave ${key}; fallback local aplicado.`, {
            module: 'CacheService',
            method: 'increment',
          });
          return next;
        });
      }

      const count = await redisClient.incr(key);

      if (count === 1) {
        await redisClient.expire(key, ttlSeconds);
      } else if (redisClient.ttl) {
        const ttl = await redisClient.ttl(key);
        if (ttl < 0) {
          await redisClient.expire(key, ttlSeconds);
        }
      }

      this.logger.debug(`Cache INCR: ${key} -> ${count}`, { module: 'CacheService', method: 'increment' });
      return count;
    } catch (error: unknown) {
      this.logger.warn(`Erro ao incrementar cache: ${key}`, { module: 'CacheService', method: 'increment', error: getErrorMessage(error) });
      throw error;
    }
  }

  /**
   * Deletar do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`, { module: 'CacheService', method: 'del' });
    } catch (error: unknown) {
      this.logger.warn(`Erro ao remover cache: ${key}`, { module: 'CacheService', method: 'del', error: getErrorMessage(error) });
    }
  }

  /**
   * Limpar todo o cache
   */
  async reset(): Promise<void> {
    try {
      // O cache-manager v5 usa store.reset() se disponível
      const store = (this.cacheManager as Cache & { store?: { reset?: () => Promise<void> } }).store;
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
    } catch (error: unknown) {
      this.logger.warn('Erro ao limpar cache', { module: 'CacheService', method: 'reset', error: getErrorMessage(error) });
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
    } catch (error: unknown) {
      this.logger.warn(`Erro no getOrSet para ${key}`, { module: 'CacheService', method: 'getOrSet', error: getErrorMessage(error) });
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
  generateUserKey(userId: string, resource: string, params?: Record<string, unknown>): string {
    const paramStr = params ? `:${Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 10)}` : '';
    return `user:${userId}:${resource}${paramStr}`;
  }

  private resolveRedisIncrementClient(): RedisIncrementClient | undefined {
    const cacheAny = this.cacheManager as Cache & {
      store?: { getClient?: () => unknown; client?: unknown };
      stores?: Array<{ getClient?: () => unknown; client?: unknown }>;
    };

    const candidates: unknown[] = [
      cacheAny.store?.getClient?.(),
      cacheAny.store?.client,
      cacheAny.stores?.[0]?.getClient?.(),
      cacheAny.stores?.[0]?.client,
    ];

    for (const candidate of candidates) {
      const maybeClient = candidate as Partial<RedisIncrementClient> | undefined;
      if (maybeClient && typeof maybeClient.incr === 'function' && typeof maybeClient.expire === 'function') {
        return maybeClient as RedisIncrementClient;
      }
    }

    return undefined;
  }

  private async withIncrementLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.incrementLocks.get(key) ?? Promise.resolve();
    let release: (() => void) | undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chain = previous.then(() => current);
    this.incrementLocks.set(key, chain);

    await previous;

    try {
      return await operation();
    } finally {
      release?.();
      if (this.incrementLocks.get(key) === chain) {
        this.incrementLocks.delete(key);
      }
    }
  }
}
