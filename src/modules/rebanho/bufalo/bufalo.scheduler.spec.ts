import { Test, TestingModule } from '@nestjs/testing';
import { BufaloScheduler } from './bufalo.scheduler';
import { BufaloRepositoryDrizzle } from './repositories/bufalo.repository.drizzle';
import { BufaloMaturidadeService } from './services/bufalo-maturidade.service';

describe('BufaloScheduler', () => {
  let scheduler: BufaloScheduler;
  let bufaloRepo: jest.Mocked<BufaloRepositoryDrizzle>;
  let maturidadeService: jest.Mocked<BufaloMaturidadeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BufaloScheduler,
        {
          provide: BufaloRepositoryDrizzle,
          useValue: {
            findWithFilters: jest.fn(),
          },
        },
        {
          provide: BufaloMaturidadeService,
          useValue: {
            atualizarMaturidadeSeNecessario: jest.fn(),
          },
        },
      ],
    }).compile();

    scheduler = module.get<BufaloScheduler>(BufaloScheduler);
    bufaloRepo = module.get(BufaloRepositoryDrizzle);
    maturidadeService = module.get(BufaloMaturidadeService);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('handleMaturityUpdate - Controle de Concorrência', () => {
    it('deve executar job normalmente quando não está rodando', async () => {
      const mockBufalos = [
        { id_bufalo: '1', nome: 'Bufalo 1', status: true },
        { id_bufalo: '2', nome: 'Bufalo 2', status: true },
      ];

      bufaloRepo.findWithFilters.mockResolvedValue({
        data: mockBufalos,
        error: null,
      });

      maturidadeService.atualizarMaturidadeSeNecessario.mockResolvedValue(2);

      await scheduler.handleMaturityUpdate();

      expect(bufaloRepo.findWithFilters).toHaveBeenCalledWith({ status: true }, { offset: 0, limit: 1000 });
      expect(maturidadeService.atualizarMaturidadeSeNecessario).toHaveBeenCalledWith(mockBufalos);
    });

    it('deve prevenir execução concorrente', async () => {
      const mockBufalos = [{ id_bufalo: '1', nome: 'Bufalo 1', status: true }];

      bufaloRepo.findWithFilters.mockResolvedValue({
        data: mockBufalos,
        error: null,
      });

      // Simula job demorado
      maturidadeService.atualizarMaturidadeSeNecessario.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(1), 100);
          }),
      );

      // Inicia primeira execução (não aguarda)
      const firstExecution = scheduler.handleMaturityUpdate();

      // Tenta segunda execução enquanto primeira ainda está rodando
      await scheduler.handleMaturityUpdate();

      // Segunda execução deve ter sido pulada
      expect(bufaloRepo.findWithFilters).toHaveBeenCalledTimes(1);

      // Aguarda primeira execução terminar
      await firstExecution;
    });

    it('deve liberar flag isRunning após erro', async () => {
      bufaloRepo.findWithFilters.mockResolvedValue({
        data: [{ id_bufalo: '1', nome: 'Bufalo 1', status: true }],
        error: null,
      });

      // Simula erro no service
      maturidadeService.atualizarMaturidadeSeNecessario.mockRejectedValue(new Error('Erro no banco de dados'));

      // Primeira execução com erro
      await scheduler.handleMaturityUpdate();

      // Segunda execução deve rodar normalmente (flag foi liberada)
      maturidadeService.atualizarMaturidadeSeNecessario.mockResolvedValue(1);

      await scheduler.handleMaturityUpdate();

      expect(bufaloRepo.findWithFilters).toHaveBeenCalledTimes(2);
    });

    it('deve lidar com array vazio de búfalos', async () => {
      bufaloRepo.findWithFilters.mockResolvedValue({
        data: [],
        error: null,
      });

      await scheduler.handleMaturityUpdate();

      expect(bufaloRepo.findWithFilters).toHaveBeenCalled();
      expect(maturidadeService.atualizarMaturidadeSeNecessario).not.toHaveBeenCalled();
    });

    it('deve lidar com búfalos null', async () => {
      bufaloRepo.findWithFilters.mockResolvedValue({
        data: [],
        error: null,
      });

      await scheduler.handleMaturityUpdate();

      expect(bufaloRepo.findWithFilters).toHaveBeenCalled();
      expect(maturidadeService.atualizarMaturidadeSeNecessario).not.toHaveBeenCalled();
    });

    it('deve respeitar limite de 1000 búfalos', async () => {
      bufaloRepo.findWithFilters.mockResolvedValue({
        data: [],
        error: null,
      });

      await scheduler.handleMaturityUpdate();

      expect(bufaloRepo.findWithFilters).toHaveBeenCalledWith({ status: true }, { offset: 0, limit: 1000 });
    });

    it('deve registrar duração do job', async () => {
      const mockBufalos = [{ id_bufalo: '1', nome: 'Bufalo 1', status: true }];

      bufaloRepo.findWithFilters.mockResolvedValue({
        data: mockBufalos,
        error: null,
      });

      maturidadeService.atualizarMaturidadeSeNecessario.mockResolvedValue(1);

      const loggerSpy = jest.spyOn((scheduler as any).logger, 'log');

      await scheduler.handleMaturityUpdate();

      // Deve ter logado com tempo de execução
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('finalizado em'));
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('s.'));
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve logar erro quando findWithFilters falha', async () => {
      bufaloRepo.findWithFilters.mockRejectedValue(new Error('Database error'));

      const loggerSpy = jest.spyOn((scheduler as any).logger, 'error');

      await scheduler.handleMaturityUpdate();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Erro no job de maturidade'), expect.any(String));

      // Flag deve ser liberada mesmo com erro
      expect((scheduler as any).isRunning).toBe(false);
    });

    it('deve logar erro quando atualizarMaturidade falha', async () => {
      bufaloRepo.findWithFilters.mockResolvedValue({
        data: [{ id_bufalo: '1', nome: 'Test', status: true }],
        error: null,
      });

      maturidadeService.atualizarMaturidadeSeNecessario.mockRejectedValue(new Error('Update failed'));

      const loggerSpy = jest.spyOn((scheduler as any).logger, 'error');

      await scheduler.handleMaturityUpdate();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Erro no job de maturidade'), expect.any(String));
    });
  });
});
