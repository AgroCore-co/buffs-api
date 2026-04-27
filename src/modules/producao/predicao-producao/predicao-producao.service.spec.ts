import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { CacheService } from '../../../core/cache/cache.service';
import { PredicaoProducaoService } from './predicao-producao.service';

describe('PredicaoProducaoService', () => {
  let service: PredicaoProducaoService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let cacheService: jest.Mocked<CacheService>;

  const buildResposta = (idFemea: string, litros = 1200) => ({
    idFemea,
    predicaoLitros: litros,
    classificacaoPotencial: 'ALTA',
    percentualVsMedia: 12.5,
    producaoMediaPropriedade: 1066,
    idPropriedade: 1,
    featuresUtilizadas: ['idade', 'producao_anterior'],
    dataPredicao: '2026-04-13T12:00:00.000Z',
  });

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configService = {
      get: jest.fn().mockReturnValue('http://ia.local'),
      getOrThrow: jest.fn().mockReturnValue('test-internal-key'),
    } as unknown as jest.Mocked<ConfigService>;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    service = new PredicaoProducaoService(httpService, configService, cacheService);
  });

  it('deve retornar predição do cache quando houver HIT', async () => {
    const cached = buildResposta('123e4567-e89b-42d3-a456-426614174000', 1300);
    cacheService.get.mockResolvedValue(cached);

    const result = await service.predizerProducaoIndividual('123e4567-e89b-42d3-a456-426614174000', 'user-1');

    expect(result).toEqual(cached);
    expect(httpService.post).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('deve consultar IA e persistir cache quando houver MISS', async () => {
    const idFemea = '123e4567-e89b-42d3-a456-426614174001';
    const payload = buildResposta(idFemea, 1111);

    cacheService.get.mockResolvedValue(undefined);
    httpService.post.mockReturnValue(of({ data: payload } as any));

    const result = await service.predizerProducaoIndividual(idFemea, 'user-10');

    expect(result).toEqual(payload);
    expect(httpService.post).toHaveBeenCalledWith(
      'http://ia.local/predicao-individual',
      { idFemea },
      {
        headers: { 'x-user-id': 'user-10', 'x-internal-key': 'test-internal-key' },
        timeout: 30000,
      },
    );
    expect(cacheService.set).toHaveBeenCalledWith(`predicao:producao:user-10:${idFemea}`, payload, 600000);
  });

  it('deve isolar cache por usuario e femea', async () => {
    cacheService.get.mockResolvedValue(undefined);
    httpService.post.mockImplementation((_url: string, body?: any) => {
      const idFemea = body?.idFemea as string;
      const litros = idFemea.endsWith('1') ? 900 : 1500;
      return of({ data: buildResposta(idFemea, litros) } as any);
    });

    const idFemeaA = '123e4567-e89b-42d3-a456-426614174001';
    const idFemeaB = '123e4567-e89b-42d3-a456-426614174002';

    await service.predizerProducaoIndividual(idFemeaA, 'user-77');
    await service.predizerProducaoIndividual(idFemeaB, 'user-77');

    expect(cacheService.get).toHaveBeenNthCalledWith(1, `predicao:producao:user-77:${idFemeaA}`);
    expect(cacheService.get).toHaveBeenNthCalledWith(2, `predicao:producao:user-77:${idFemeaB}`);
    expect(httpService.post).toHaveBeenCalledTimes(2);
  });
});
