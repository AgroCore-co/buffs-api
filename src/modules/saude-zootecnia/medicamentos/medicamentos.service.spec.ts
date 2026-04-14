import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AuthHelperService } from '../../../core/services/auth-helper.service';
import { CreateMedicacaoDto } from './dto/create-medicacao.dto';
import { TipoTratamentoMedicacao } from './enums';
import { MedicamentosRepositoryDrizzle } from './repositories';
import { MedicamentosService } from './medicamentos.service';

describe('MedicamentosService', () => {
  let service: MedicamentosService;
  let repository: jest.Mocked<MedicamentosRepositoryDrizzle>;
  let authHelper: jest.Mocked<AuthHelperService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    repository = {
      createFromDto: jest.fn(),
      findByPropriedade: jest.fn(),
      findById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      updateFromDto: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<MedicamentosRepositoryDrizzle>;

    const logger = {} as LoggerService;

    authHelper = {
      validatePropriedadeAccess: jest.fn(),
    } as unknown as jest.Mocked<AuthHelperService>;
    authHelper.validatePropriedadeAccess.mockResolvedValue();

    cacheService = {
      getOrSet: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;
    cacheService.del.mockResolvedValue();
    cacheService.getOrSet.mockImplementation(async (_key, fetchFn) => fetchFn());

    service = new MedicamentosService(repository, logger, authHelper, cacheService);
  });

  it('deve validar ownership e usar cache no findByPropriedade', async () => {
    repository.findByPropriedade.mockResolvedValue([{ idMedicacao: 'm1' }] as any);

    const data = await service.findByPropriedade('prop-1', 'user-1');

    expect(authHelper.validatePropriedadeAccess).toHaveBeenCalledWith('user-1', 'prop-1');
    expect(cacheService.getOrSet).toHaveBeenCalled();
    expect(data).toHaveLength(1);
  });

  it('deve criar medicação com método tipado e invalidar cache da propriedade', async () => {
    const dto: CreateMedicacaoDto = {
      idPropriedade: 'prop-1',
      tipoTratamento: TipoTratamentoMedicacao.VACINACAO,
      medicacao: 'Brucelose',
      descricao: 'Dose anual',
    };

    repository.createFromDto.mockResolvedValue({ idMedicacao: 'm1', idPropriedade: 'prop-1' } as any);

    await service.create(dto);

    expect(repository.createFromDto).toHaveBeenCalledWith(dto);
    expect(cacheService.del).toHaveBeenCalledWith('medicacoes:propriedade:prop-1');
  });

  it('deve invalidar cache antigo e novo quando update troca propriedade', async () => {
    repository.findById.mockResolvedValue({ idMedicacao: 'm1', idPropriedade: 'prop-old' } as any);
    repository.updateFromDto.mockResolvedValue({ idMedicacao: 'm1', idPropriedade: 'prop-new' } as any);

    await service.update('m1', { idPropriedade: 'prop-new' });

    expect(repository.updateFromDto).toHaveBeenCalledWith('m1', { idPropriedade: 'prop-new' });
    expect(cacheService.del).toHaveBeenCalledWith('medicacoes:propriedade:prop-old');
    expect(cacheService.del).toHaveBeenCalledWith('medicacoes:propriedade:prop-new');
  });

  it('deve usar busca incluindo removidos no restore', async () => {
    repository.findByIdIncludingDeleted.mockResolvedValue({
      idMedicacao: 'm1',
      idPropriedade: 'prop-1',
      deletedAt: '2026-04-14T10:00:00.000Z',
    } as any);
    repository.restore.mockResolvedValue({ idMedicacao: 'm1', deletedAt: null } as any);

    await service.restore('m1');

    expect(repository.findByIdIncludingDeleted).toHaveBeenCalledWith('m1');
    expect(repository.restore).toHaveBeenCalledWith('m1');
  });
});
