import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestSetup } from './helpers/test-setup';

describe('Producao Contracts E2E (AppModule + DB real)', () => {
  let app: INestApplication;
  let token: string;

  let idPropriedade: string;

  const now = Date.now();

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  function getId(payload: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
      if (payload?.[key]) {
        return payload[key] as string;
      }
    }

    throw new Error(`ID não encontrado no payload. Chaves testadas: ${keys.join(', ')}`);
  }

  function expectPaginationContract(body: any, page: number, limit: number): void {
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('meta');

    expect(Number(body.meta.page)).toBe(page);
    expect(Number(body.meta.limit)).toBe(limit);
    expect(typeof body.meta.total).toBe('number');
    expect(typeof body.meta.totalPages).toBe('number');
    expect(typeof body.meta.hasNextPage).toBe('boolean');
    expect(typeof body.meta.hasPrevPage).toBe('boolean');
  }

  function buildUniqueCnpj(seed: number): string {
    const digits = seed.toString().padStart(14, '0').slice(-14);
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }

  async function createEnderecoAndPropriedade(): Promise<string> {
    const enderecoResponse = await request(app.getHttpServer())
      .post('/enderecos')
      .set(authHeaders())
      .send({
        pais: 'Brasil',
        estado: 'SP',
        cidade: 'Sao Paulo',
        bairro: 'Centro',
        rua: 'Rua Teste Producao',
        numero: '100',
        cep: '01310-000',
      })
      .expect(201);

    const enderecoId = getId(enderecoResponse.body, ['idEndereco', 'id_endereco', 'id']);

    const propriedadeResponse = await request(app.getHttpServer())
      .post('/propriedades')
      .set(authHeaders())
      .send({
        nome: `Fazenda Producao E2E ${now}`,
        cnpj: buildUniqueCnpj(now),
        idEndereco: enderecoId,
        p_abcb: false,
        tipoManejo: 'P',
      });

    if (propriedadeResponse.status !== 201) {
      throw new Error(`Falha ao criar propriedade: status=${propriedadeResponse.status} body=${JSON.stringify(propriedadeResponse.body)}`);
    }

    return getId(propriedadeResponse.body, ['idPropriedade', 'id_propriedade', 'id']);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const user = await TestSetup.createAuthenticatedUser(app);

    if (!user.token) {
      throw new Error('Falha ao autenticar usuário de teste para suite de Producao E2E.');
    }

    token = user.token;

    idPropriedade = await createEnderecoAndPropriedade();
  });

  afterAll(async () => {
    const safeDelete = async (path: string): Promise<void> => {
      if (!token) return;

      try {
        await request(app.getHttpServer()).delete(path).set(authHeaders());
      } catch {
        // no-op: limpeza best effort
      }
    };

    await safeDelete(`/propriedades/${idPropriedade}`);

    if (app) {
      await app.close();
    }
  });

  it('deve manter contrato de paginação em GET /ordenhas', async () => {
    const response = await request(app.getHttpServer()).get('/ordenhas').set(authHeaders()).query({ page: 1, limit: 5 }).expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação em GET /lactacao', async () => {
    const response = await request(app.getHttpServer()).get('/lactacao').set(authHeaders()).query({ page: 1, limit: 5 }).expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação em GET /lactacao/propriedade/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/lactacao/propriedade/${idPropriedade}`)
      .set(authHeaders())
      .query({ page: 1, limit: 5 })
      .expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação em GET /producao-diaria', async () => {
    const response = await request(app.getHttpServer()).get('/producao-diaria').set(authHeaders()).query({ page: 1, limit: 5 }).expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação em GET /producao-diaria/propriedade/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/producao-diaria/propriedade/${idPropriedade}`)
      .set(authHeaders())
      .query({ page: 1, limit: 5 })
      .expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação em GET /retiradas', async () => {
    const response = await request(app.getHttpServer()).get('/retiradas').set(authHeaders()).query({ page: 1, limit: 5 }).expect(200);

    expectPaginationContract(response.body, 1, 5);
  });

  it('deve manter contrato de paginação e estatísticas em GET /retiradas/propriedade/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/retiradas/propriedade/${idPropriedade}`)
      .set(authHeaders())
      .query({ page: 1, limit: 5 })
      .expect(200);

    expectPaginationContract(response.body, 1, 5);
    expect(typeof response.body.meta.totalAprovadas).toBe('number');
    expect(typeof response.body.meta.totalRejeitadas).toBe('number');
  });
});
