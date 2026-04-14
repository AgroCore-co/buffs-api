import { CanActivate, ExecutionContext, Injectable, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import request = require('supertest');
import { PropertyExistsGuard } from '../../core/guards/property-exists.guard';
import { AuthHelperService } from '../../core/services/auth-helper.service';
import { SupabaseAuthGuard } from '../auth/guards/auth.guard';
import { DadosSanitariosController } from './dados-sanitarios/dados-sanitarios.controller';
import { DadosSanitariosService } from './dados-sanitarios/dados-sanitarios.service';
import { DadosZootecnicosController } from './dados-zootecnicos/dados-zootecnicos.controller';
import { DadosZootecnicosService } from './dados-zootecnicos/dados-zootecnicos.service';
import { MedicamentosController } from './medicamentos/medicamentos.controller';
import { MedicamentosService } from './medicamentos/medicamentos.service';

@Injectable()
class TestSupabaseAuthGuard implements CanActivate {
  static allow = true;

  canActivate(context: ExecutionContext): boolean {
    if (!TestSupabaseAuthGuard.allow) {
      return false;
    }

    const req = context.switchToHttp().getRequest();
    req.user = { email: 'propriedade@example.com' };
    return true;
  }
}

@Injectable()
class TestPropertyExistsGuard implements CanActivate {
  static deny = false;

  canActivate(): boolean {
    if (TestPropertyExistsGuard.deny) {
      throw new NotFoundException('Propriedade não encontrada');
    }

    return true;
  }
}

describe('Saude Zootecnia Controllers - rotas por propriedade', () => {
  let app: INestApplication;

  type AsyncMockFn = (...args: unknown[]) => Promise<unknown>;

  const idPropriedade = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const dadosSanitariosServiceMock = {
    findByPropriedade: jest.fn<AsyncMockFn>(),
    getFrequenciaDoencas: jest.fn<AsyncMockFn>(),
  };

  const dadosZootecnicosServiceMock = {
    findAllByPropriedade: jest.fn<AsyncMockFn>(),
  };

  const medicamentosServiceMock = {
    findByPropriedade: jest.fn<AsyncMockFn>(),
  };

  const authHelperServiceMock = {
    getUserId: jest.fn<AsyncMockFn>(),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [DadosSanitariosController, DadosZootecnicosController, MedicamentosController],
      providers: [
        { provide: DadosSanitariosService, useValue: dadosSanitariosServiceMock },
        { provide: DadosZootecnicosService, useValue: dadosZootecnicosServiceMock },
        { provide: MedicamentosService, useValue: medicamentosServiceMock },
        { provide: AuthHelperService, useValue: authHelperServiceMock },
      ],
    });

    moduleBuilder.overrideGuard(SupabaseAuthGuard).useClass(TestSupabaseAuthGuard);
    moduleBuilder.overrideGuard(PropertyExistsGuard).useClass(TestPropertyExistsGuard);

    const moduleFixture: TestingModule = await moduleBuilder.compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    TestSupabaseAuthGuard.allow = true;
    TestPropertyExistsGuard.deny = false;

    authHelperServiceMock.getUserId.mockResolvedValue('user-123');

    dadosSanitariosServiceMock.findByPropriedade.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    dadosSanitariosServiceMock.getFrequenciaDoencas.mockResolvedValue({
      dados: [],
      total_registros: 0,
      total_doencas_distintas: 0,
    });

    dadosZootecnicosServiceMock.findAllByPropriedade.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    medicamentosServiceMock.findByPropriedade.mockResolvedValue([]);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deve aplicar guards e resolver ownership em dados-sanitarios por propriedade', async () => {
    await request(app.getHttpServer()).get(`/dados-sanitarios/propriedade/${idPropriedade}`).query({ page: 1, limit: 10 }).expect(200);

    expect(authHelperServiceMock.getUserId).toHaveBeenCalledWith({ email: 'propriedade@example.com' });
    expect(dadosSanitariosServiceMock.findByPropriedade).toHaveBeenCalledWith(
      idPropriedade,
      expect.objectContaining({ page: 1, limit: 10 }),
      'user-123',
    );
  });

  it('deve aplicar guards e ownership em frequencia de doencas por propriedade', async () => {
    await request(app.getHttpServer()).get(`/dados-sanitarios/propriedade/${idPropriedade}/frequencia-doencas`).expect(200);

    expect(authHelperServiceMock.getUserId).toHaveBeenCalledWith({ email: 'propriedade@example.com' });
    expect(dadosSanitariosServiceMock.getFrequenciaDoencas).toHaveBeenCalledWith(idPropriedade, false, 0.8, 'user-123');
  });

  it('deve aplicar guards e ownership em dados-zootecnicos por propriedade', async () => {
    await request(app.getHttpServer()).get(`/dados-zootecnicos/propriedade/${idPropriedade}`).query({ page: 1, limit: 10 }).expect(200);

    expect(authHelperServiceMock.getUserId).toHaveBeenCalledWith({ email: 'propriedade@example.com' });
    expect(dadosZootecnicosServiceMock.findAllByPropriedade).toHaveBeenCalledWith(
      idPropriedade,
      expect.objectContaining({ page: 1, limit: 10 }),
      'user-123',
    );
  });

  it('deve aplicar guards e ownership em medicamentos por propriedade', async () => {
    await request(app.getHttpServer()).get(`/medicamentos/propriedade/${idPropriedade}`).expect(200);

    expect(authHelperServiceMock.getUserId).toHaveBeenCalledWith({ email: 'propriedade@example.com' });
    expect(medicamentosServiceMock.findByPropriedade).toHaveBeenCalledWith(idPropriedade, 'user-123');
  });

  it('deve retornar 404 quando PropertyExistsGuard falhar', async () => {
    TestPropertyExistsGuard.deny = true;

    await request(app.getHttpServer()).get(`/dados-sanitarios/propriedade/${idPropriedade}`).expect(404);

    expect(dadosSanitariosServiceMock.findByPropriedade).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando SupabaseAuthGuard negar acesso', async () => {
    TestSupabaseAuthGuard.allow = false;

    await request(app.getHttpServer()).get(`/medicamentos/propriedade/${idPropriedade}`).expect(403);

    expect(authHelperServiceMock.getUserId).not.toHaveBeenCalled();
    expect(medicamentosServiceMock.findByPropriedade).not.toHaveBeenCalled();
  });
});
