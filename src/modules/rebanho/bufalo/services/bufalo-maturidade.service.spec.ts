import { Test, TestingModule } from '@nestjs/testing';
import { BufaloMaturidadeService } from './bufalo-maturidade.service';
import { BufaloRepositoryDrizzle } from '../repositories/bufalo.repository.drizzle';
import { SexoBufalo, NivelMaturidade } from '../dto/create-bufalo.dto';

describe('BufaloMaturidadeService', () => {
  let service: BufaloMaturidadeService;
  let bufaloRepo: jest.Mocked<BufaloRepositoryDrizzle>;

  beforeEach(async () => {
    // Limpa variáveis de ambiente antes de cada teste
    delete process.env.LOG_LEVEL;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BufaloMaturidadeService,
        {
          provide: BufaloRepositoryDrizzle,
          useValue: {
            updateMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BufaloMaturidadeService>(BufaloMaturidadeService);
    bufaloRepo = module.get(BufaloRepositoryDrizzle);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processarDadosMaturidade', () => {
    it('deve calcular maturidade para bezerro (0-18 meses)', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 10); // 10 meses atrás

      const bufaloData = {
        nome: 'Bezerro',
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.MACHO,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result.nivel_maturidade).toBe(NivelMaturidade.BEZERRO);
    });

    it('deve calcular maturidade para novilho (18-30 meses macho)', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 20); // 20 meses atrás (entre 12-24)

      const bufaloData = {
        nome: 'Novilho',
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.MACHO,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result.nivel_maturidade).toBe(NivelMaturidade.NOVILHO_NOVILHA);
    });

    it('deve calcular maturidade para touro (30+ meses)', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 36); // 36 meses atrás

      const bufaloData = {
        nome: 'Touro',
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.MACHO,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result.nivel_maturidade).toBe(NivelMaturidade.TOURO);
    });

    it('deve calcular maturidade para novilha (18-24 meses fêmea)', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 20); // 20 meses atrás

      const bufaloData = {
        nome: 'Novilha',
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.FEMEA,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result.nivel_maturidade).toBe(NivelMaturidade.NOVILHO_NOVILHA);
    });

    it('deve calcular maturidade para vaca (24+ meses fêmea)', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 40); // 40 meses atrás (36+ para vaca)

      const bufaloData = {
        nome: 'Vaca',
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.FEMEA,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result.nivel_maturidade).toBe(NivelMaturidade.VACA);
    });

    it('deve retornar dados inalterados se não tiver dt_nascimento', () => {
      const bufaloData = {
        nome: 'Sem Data',
        sexo: SexoBufalo.MACHO,
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result).toEqual(bufaloData);
      expect(result.nivel_maturidade).toBeUndefined();
    });

    it('deve retornar dados inalterados se não tiver sexo', () => {
      const bufaloData = {
        nome: 'Sem Sexo',
        dt_nascimento: new Date(),
      };

      const result = service.processarDadosMaturidade(bufaloData);

      expect(result).toEqual(bufaloData);
      expect(result.nivel_maturidade).toBeUndefined();
    });
  });

  describe('atualizarMaturidadeSeNecessario', () => {
    it('deve atualizar búfalos que mudaram de maturidade', async () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 32); // 32 meses (deve ser touro)

      const bufalos = [
        {
          id_bufalo: 'bufalo-1',
          nome: 'Touro Velho',
          dt_nascimento: dataNascimento,
          sexo: SexoBufalo.MACHO,
          nivel_maturidade: NivelMaturidade.NOVILHO_NOVILHA, // Desatualizado
          status: true,
        },
      ];

      bufaloRepo.updateMany.mockResolvedValue([]);

      const count = await service.atualizarMaturidadeSeNecessario(bufalos);

      expect(count).toBe(1);
      expect(bufaloRepo.updateMany).toHaveBeenCalledWith(['bufalo-1'], { nivel_maturidade: NivelMaturidade.TOURO });
    });

    it('não deve atualizar búfalos com maturidade correta', async () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 10); // 10 meses (bezerro)

      const bufalos = [
        {
          id_bufalo: 'bufalo-1',
          nome: 'Bezerro',
          dt_nascimento: dataNascimento,
          sexo: SexoBufalo.MACHO,
          nivel_maturidade: NivelMaturidade.BEZERRO, // Já está correto
          status: true,
        },
      ];

      const count = await service.atualizarMaturidadeSeNecessario(bufalos);

      expect(count).toBe(0);
      expect(bufaloRepo.updateMany).not.toHaveBeenCalled();
    });

    it('deve ignorar búfalos inativos', async () => {
      const bufalos = [
        {
          id_bufalo: 'bufalo-1',
          nome: 'Inativo',
          dt_nascimento: new Date(),
          sexo: SexoBufalo.MACHO,
          nivel_maturidade: NivelMaturidade.BEZERRO,
          status: false, // Inativo
        },
      ];

      const count = await service.atualizarMaturidadeSeNecessario(bufalos);

      expect(count).toBe(0);
      expect(bufaloRepo.updateMany).not.toHaveBeenCalled();
    });

    it('deve agrupar atualizações por nível de maturidade', async () => {
      const dataAtual = new Date();

      // Bezerro que virou novilho
      const dataBezNovilho = new Date(dataAtual);
      dataBezNovilho.setMonth(dataBezNovilho.getMonth() - 20);

      // Novilho que virou touro
      const dataNovilhoTouro = new Date(dataAtual);
      dataNovilhoTouro.setMonth(dataNovilhoTouro.getMonth() - 32);

      const bufalos = [
        {
          id_bufalo: 'bufalo-1',
          nome: 'Virou Novilho',
          dt_nascimento: dataBezNovilho,
          sexo: SexoBufalo.MACHO,
          nivel_maturidade: NivelMaturidade.BEZERRO,
          status: true,
        },
        {
          id_bufalo: 'bufalo-2',
          nome: 'Virou Touro',
          dt_nascimento: dataNovilhoTouro,
          sexo: SexoBufalo.MACHO,
          nivel_maturidade: NivelMaturidade.NOVILHO_NOVILHA,
          status: true,
        },
      ];

      bufaloRepo.updateMany.mockResolvedValue([]);

      const count = await service.atualizarMaturidadeSeNecessario(bufalos);

      expect(count).toBe(2);
      // Deve ter chamado updateMany 2 vezes (uma para cada nível)
      expect(bufaloRepo.updateMany).toHaveBeenCalledTimes(2);
    });

    it('deve retornar 0 para array vazio', async () => {
      const count = await service.atualizarMaturidadeSeNecessario([]);

      expect(count).toBe(0);
      expect(bufaloRepo.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('Logging Condicional', () => {
    it('deve habilitar debug quando LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug';

      // Recria o service com a nova variável de ambiente
      const serviceWithDebug = new BufaloMaturidadeService(bufaloRepo);

      // Acessa propriedade privada para teste
      expect((serviceWithDebug as any).debugEnabled).toBe(true);
    });

    it('deve desabilitar debug quando LOG_LEVEL != debug', () => {
      process.env.LOG_LEVEL = 'info';

      const serviceWithoutDebug = new BufaloMaturidadeService(bufaloRepo);

      expect((serviceWithoutDebug as any).debugEnabled).toBe(false);
    });

    it('deve desabilitar debug quando LOG_LEVEL não está definido', () => {
      delete process.env.LOG_LEVEL;

      const serviceDefault = new BufaloMaturidadeService(bufaloRepo);

      expect((serviceDefault as any).debugEnabled).toBe(false);
    });
  });

  describe('precisaAtualizarMaturidade', () => {
    it('deve retornar true quando maturidade está desatualizada', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 32);

      const bufalo = {
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.MACHO,
        nivel_maturidade: NivelMaturidade.BEZERRO, // Deveria ser touro
      };

      const result = service.precisaAtualizarMaturidade(bufalo);

      expect(result).toBe(true);
    });

    it('deve retornar false quando maturidade está correta', () => {
      const dataAtual = new Date();
      const dataNascimento = new Date(dataAtual);
      dataNascimento.setMonth(dataNascimento.getMonth() - 10);

      const bufalo = {
        dt_nascimento: dataNascimento,
        sexo: SexoBufalo.MACHO,
        nivel_maturidade: NivelMaturidade.BEZERRO,
      };

      const result = service.precisaAtualizarMaturidade(bufalo);

      expect(result).toBe(false);
    });
  });
});
