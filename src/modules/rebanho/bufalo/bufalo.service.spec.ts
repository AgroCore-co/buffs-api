import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BufaloService } from './bufalo.service';
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { UsuarioPropriedadeRepositoryDrizzle } from './repositories/usuario-propriedade.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';
import { BufaloCategoriaService } from './services/bufalo-categoria.service';
import { BufaloFiltrosService } from './services/bufalo-filtros.service';
import { GenealogiaService } from '../../reproducao/genealogia/genealogia.service';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';

describe('BufaloService', () => {
  let service: BufaloService;
  let bufaloRepo: jest.Mocked<BufaloRepositoryDrizzle>;
  let usuarioPropriedadeRepo: jest.Mocked<UsuarioPropriedadeRepositoryDrizzle>;
  let cacheService: jest.Mocked<CacheService>;

  const mockUser = { email: 'test@example.com' };
  const mockUserId = 'user-123';
  const mockPropriedadeId = 'prop-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BufaloService,
        {
          provide: BufaloRepositoryDrizzle,
          useValue: {
            findById: jest.fn(),
            findChildrenIds: jest.fn(),
            findActiveByIds: jest.fn(),
            findWithFilters: jest.fn(),
            countWithFilters: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: UsuarioPropriedadeRepositoryDrizzle,
          useValue: {
            buscarUsuarioPorEmail: jest.fn(),
            buscarPropriedadesComoDono: jest.fn(),
            buscarPropriedadesComoFuncionario: jest.fn(),
            buscarPropriedadePorId: jest.fn(),
          },
        },
        {
          provide: GenealogiaService,
          useValue: {
            construirArvoreGenealogica: jest.fn(),
            construirArvoreParaCategoria: jest.fn(),
          },
        },
        {
          provide: BufaloMaturidadeService,
          useValue: {
            processarDadosMaturidade: jest.fn((data) => data),
            atualizarMaturidadeSeNecessario: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: BufaloCategoriaService,
          useValue: {
            processarCategoriaABCB: jest.fn(),
          },
        },
        {
          provide: BufaloFiltrosService,
          useValue: {
            filtrarBufalos: jest.fn(),
            buscarPorId: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BufaloService>(BufaloService);
    bufaloRepo = module.get(BufaloRepositoryDrizzle);
    usuarioPropriedadeRepo = module.get(UsuarioPropriedadeRepositoryDrizzle);
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Validação de Circularidade Genealógica', () => {
    beforeEach(() => {
      // Setup mocks para usuário e propriedade
      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue([mockPropriedadeId]);
      usuarioPropriedadeRepo.buscarPropriedadePorId.mockResolvedValue({
        idPropriedade: mockPropriedadeId,
        pAbcb: false,
      });
    });

    it('deve rejeitar búfalo sendo pai de si mesmo', async () => {
      const createDto = {
        nome: 'Test',
        sexo: 'M',
        id_propriedade: mockPropriedadeId,
        id_pai: 'bufalo-123', // Seria o mesmo ID após criação
        id_mae: null,
      };

      // Mock do create para retornar o ID
      bufaloRepo.create.mockImplementation(async (data) => ({
        idBufalo: 'bufalo-123',
        ...data,
      }));

      // Na prática, a validação acontece antes do create
      // Vamos testar o método update que tem o ID
      bufaloRepo.findById.mockResolvedValue({
        idBufalo: 'bufalo-123',
        idPropriedade: mockPropriedadeId,
        idPai: null,
        idMae: null,
      });

      await expect(service.update('bufalo-123', { idPai: 'bufalo-123' }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar búfalo sendo mãe de si mesmo', async () => {
      bufaloRepo.findById.mockResolvedValue({
        idBufalo: 'bufalo-123',
        idPropriedade: mockPropriedadeId,
        idPai: null,
        idMae: null,
      });

      await expect(service.update('bufalo-123', { idMae: 'bufalo-123' }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar pai e mãe sendo o mesmo animal', async () => {
      const createDto = {
        nome: 'Test',
        sexo: 'M',
        id_propriedade: mockPropriedadeId,
        id_pai: 'parent-123',
        id_mae: 'parent-123', // Mesmo ID que o pai
      };

      await expect(service.create(createDto as any, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar pai que é descendente do búfalo', async () => {
      const bufaloId = 'bufalo-123';
      const descendenteId = 'descendente-456';

      bufaloRepo.findById.mockResolvedValue({
        idBufalo: bufaloId,
        idPropriedade: mockPropriedadeId,
        idPai: null,
        idMae: null,
      });

      // Mock: bufalo-123 tem filho descendente-456
      bufaloRepo.findChildrenIds.mockResolvedValue([descendenteId]);

      await expect(service.update(bufaloId, { idPai: descendenteId }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar mãe que é descendente do búfalo', async () => {
      const bufaloId = 'bufalo-123';
      const descendenteId = 'descendente-456';

      bufaloRepo.findById.mockResolvedValue({
        idBufalo: bufaloId,
        idPropriedade: mockPropriedadeId,
        idPai: null,
        idMae: null,
      });

      bufaloRepo.findChildrenIds.mockResolvedValue([descendenteId]);

      await expect(service.update(bufaloId, { idMae: descendenteId }, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('deve aceitar genealogia válida', async () => {
      const createDto = {
        nome: 'Cria',
        sexo: 'F',
        id_propriedade: mockPropriedadeId,
        id_pai: 'pai-123',
        id_mae: 'mae-456',
      };

      bufaloRepo.findChildrenIds.mockResolvedValue([]); // Sem descendentes
      bufaloRepo.create.mockResolvedValue({
        idBufalo: 'new-bufalo',
        ...createDto,
      } as any);

      const result = await service.create(createDto as any, mockUser);

      expect(result).toBeDefined();
      expect(bufaloRepo.create).toHaveBeenCalled();
    });
  });

  describe('Batch Enrichment (N+1 Fix)', () => {
    it('deve buscar pais/mães em uma única query', async () => {
      const mockBufalos = [
        { idBufalo: '1', nome: 'Bufalo 1', idPai: 'pai-1', idMae: 'mae-1' },
        { idBufalo: '2', nome: 'Bufalo 2', idPai: 'pai-1', idMae: 'mae-2' },
        { idBufalo: '3', nome: 'Bufalo 3', idPai: 'pai-2', idMae: 'mae-1' },
      ];

      const mockParents = [
        { idBufalo: 'pai-1', brinco: 'P001', nome: 'Pai 1' },
        { idBufalo: 'pai-2', brinco: 'P002', nome: 'Pai 2' },
        { idBufalo: 'mae-1', brinco: 'M001', nome: 'Mae 1' },
        { idBufalo: 'mae-2', brinco: 'M002', nome: 'Mae 2' },
      ];

      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue([mockPropriedadeId]);

      bufaloRepo.findWithFilters.mockResolvedValue({
        data: mockBufalos,
        error: null,
      });

      bufaloRepo.countWithFilters.mockResolvedValue({ count: 3, error: null });
      bufaloRepo.findActiveByIds.mockResolvedValue(mockParents);

      const result = await service.findAll(mockUser);

      // Deve ter chamado findActiveByIds UMA VEZ com 4 IDs únicos
      expect(bufaloRepo.findActiveByIds).toHaveBeenCalledTimes(1);
      expect(bufaloRepo.findActiveByIds).toHaveBeenCalledWith(expect.arrayContaining(['pai-1', 'mae-1', 'pai-2', 'mae-2']));

      // Resultado deve ter búfalos enriquecidos
      expect(result.data).toHaveLength(3);
    });

    it('deve lidar com búfalos sem pais', async () => {
      const mockBufalos = [{ idBufalo: '1', nome: 'Bufalo Sem Pais', idPai: null, idMae: null }];

      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue([mockPropriedadeId]);

      bufaloRepo.findWithFilters.mockResolvedValue({
        data: mockBufalos,
        error: null,
      });

      bufaloRepo.countWithFilters.mockResolvedValue({ count: 1, error: null });
      bufaloRepo.findActiveByIds.mockResolvedValue([]);

      const result = await service.findAll(mockUser);

      // Não deve chamar findActiveByIds se não há pais
      expect(bufaloRepo.findActiveByIds).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('Cache de Propriedades', () => {
    it('deve cachear propriedades por 30 segundos', async () => {
      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue(null); // Cache vazio

      usuarioPropriedadeRepo.buscarPropriedadesComoDono.mockResolvedValue([{ idPropriedade: 'prop-1' }]);
      usuarioPropriedadeRepo.buscarPropriedadesComoFuncionario.mockResolvedValue([{ idPropriedade: 'prop-2' }]);

      bufaloRepo.findWithFilters.mockResolvedValue({ data: [], error: null });
      bufaloRepo.countWithFilters.mockResolvedValue({ count: 0, error: null });

      await service.findAll(mockUser);

      // Deve ter salvo no cache com TTL de 30000ms
      expect(cacheService.set).toHaveBeenCalledWith(`user_props:${mockUserId}`, ['prop-1', 'prop-2'], 30000);
    });

    it('deve usar cache quando disponível', async () => {
      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue(['prop-cached']);

      bufaloRepo.findWithFilters.mockResolvedValue({ data: [], error: null });
      bufaloRepo.countWithFilters.mockResolvedValue({ count: 0, error: null });

      await service.findAll(mockUser);

      // Não deve buscar do banco se tem cache
      expect(usuarioPropriedadeRepo.buscarPropriedadesComoDono).not.toHaveBeenCalled();
      expect(usuarioPropriedadeRepo.buscarPropriedadesComoFuncionario).not.toHaveBeenCalled();
    });

    it('deve invalidar cache de propriedades', async () => {
      await service.invalidarCachePropriedades(mockUserId);

      expect(cacheService.del).toHaveBeenCalledWith(`user_props:${mockUserId}`);
    });
  });

  describe('Validação de Acesso', () => {
    it('deve rejeitar acesso a búfalo de outra propriedade', async () => {
      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue(['prop-allowed']);

      bufaloRepo.findById.mockResolvedValue({
        idBufalo: 'bufalo-123',
        idPropriedade: 'prop-forbidden', // Propriedade diferente
      });

      await expect(service.findOne('bufalo-123', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('deve permitir acesso a búfalo da mesma propriedade', async () => {
      usuarioPropriedadeRepo.buscarUsuarioPorEmail.mockResolvedValue({ idUsuario: mockUserId });
      cacheService.get.mockResolvedValue([mockPropriedadeId]);

      bufaloRepo.findById.mockResolvedValue({
        idBufalo: 'bufalo-123',
        idPropriedade: mockPropriedadeId,
      });

      const result = await service.findOne('bufalo-123', mockUser);

      expect(result).toBeDefined();
      expect(result.idBufalo).toBe('bufalo-123');
    });
  });
});
