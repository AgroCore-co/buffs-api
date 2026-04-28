import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

type AuthUser = {
  email: string;
  password: string;
  token: string;
};

describe('IA E2E - Acesso negado entre propriedades', () => {
  let app: INestApplication;

  let ownerA: AuthUser;
  let ownerB: AuthUser;

  let propriedadeAId: string;
  let propriedadeBId: string;
  let racaId: string;
  let femeaAId: string;
  let machoAId: string;

  const createdBufalos: string[] = [];

  const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

  const getId = (payload: Record<string, any>, keys: string[]): string => {
    for (const key of keys) {
      if (payload?.[key]) {
        return String(payload[key]);
      }
    }
    throw new Error(`ID nao encontrado no payload. Chaves testadas: ${keys.join(', ')}`);
  };

  const uniqueEmail = (prefix: string): string => `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@example.com`;

  const uniqueCnpj = (seed: number): string => {
    const digits = seed.toString().padStart(14, '0').slice(-14);
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const createAuthenticatedUser = async (prefix: string): Promise<AuthUser> => {
    const email = uniqueEmail(prefix);
    const password = 'Test@123456';

    const signup = await request(app.getHttpServer())
      .post('/auth/signup-proprietario')
      .send({
        email,
        password,
        nome: `Usuario ${prefix}`,
        telefone: '11999999999',
      });

    if (![200, 201].includes(signup.status)) {
      throw new Error(`Falha no signup (${prefix}): status=${signup.status} body=${JSON.stringify(signup.body)}`);
    }

    const signin = await request(app.getHttpServer()).post('/auth/signin').send({ email, password });

    if (![200, 201].includes(signin.status) || !signin.body?.access_token) {
      throw new Error(`Falha no signin (${prefix}): status=${signin.status} body=${JSON.stringify(signin.body)}`);
    }

    return {
      email,
      password,
      token: signin.body.access_token,
    };
  };

  const createPropriedade = async (token: string, label: string): Promise<string> => {
    const enderecoRes = await request(app.getHttpServer())
      .post('/enderecos')
      .set(authHeaders(token))
      .send({
        pais: 'Brasil',
        estado: 'SP',
        cidade: 'Sao Paulo',
        bairro: `Bairro ${label}`,
        rua: `Rua ${label}`,
        numero: '100',
        cep: '01310-000',
      })
      .expect(201);

    const enderecoId = getId(enderecoRes.body, ['idEndereco', 'id_endereco', 'id']);

    const propRes = await request(app.getHttpServer())
      .post('/propriedades')
      .set(authHeaders(token))
      .send({
        nome: `Fazenda ${label}`,
        cnpj: uniqueCnpj(Date.now() + Math.floor(Math.random() * 10000)),
        idEndereco: enderecoId,
        p_abcb: false,
        tipoManejo: 'P',
      });

    if (propRes.status !== 201) {
      throw new Error(`Falha ao criar propriedade (${label}): status=${propRes.status} body=${JSON.stringify(propRes.body)}`);
    }

    return getId(propRes.body, ['idPropriedade', 'id_propriedade', 'id']);
  };

  const createRaca = async (token: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/racas')
      .set(authHeaders(token))
      .send({ nome: `Raca E2E ${Date.now()}` })
      .expect(201);

    return getId(res.body, ['idRaca', 'id_raca', 'id']);
  };

  const createBufalo = async (
    token: string,
    data: {
      nome: string;
      sexo: 'M' | 'F';
      idPropriedade: string;
      idRaca: string;
    },
  ): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/bufalos')
      .set(authHeaders(token))
      .send({
        nome: data.nome,
        sexo: data.sexo,
        idPropriedade: data.idPropriedade,
        idRaca: data.idRaca,
        dtNascimento: data.sexo === 'F' ? '2019-06-20' : '2020-01-15',
      });

    if (res.status !== 201) {
      throw new Error(`Falha ao criar búfalo: status=${res.status} body=${JSON.stringify(res.body)}`);
    }

    const id = getId(res.body, ['idBufalo', 'id_bufalo', 'id']);
    createdBufalos.push(id);
    return id;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ownerA = await createAuthenticatedUser('owner-a');
    ownerB = await createAuthenticatedUser('owner-b');

    propriedadeAId = await createPropriedade(ownerA.token, 'A');
    propriedadeBId = await createPropriedade(ownerB.token, 'B');

    racaId = await createRaca(ownerA.token);

    femeaAId = await createBufalo(ownerA.token, {
      nome: 'Femea E2E',
      sexo: 'F',
      idPropriedade: propriedadeAId,
      idRaca: racaId,
    });

    machoAId = await createBufalo(ownerA.token, {
      nome: 'Macho E2E',
      sexo: 'M',
      idPropriedade: propriedadeAId,
      idRaca: racaId,
    });
  });

  afterAll(async () => {
    const safeDelete = async (path: string, token: string): Promise<void> => {
      try {
        await request(app.getHttpServer()).delete(path).set(authHeaders(token));
      } catch {
        // cleanup best effort
      }
    };

    for (const id of createdBufalos) {
      await safeDelete(`/bufalos/${id}`, ownerA.token);
    }

    await safeDelete(`/propriedades/${propriedadeAId}`, ownerA.token);
    await safeDelete(`/propriedades/${propriedadeBId}`, ownerB.token);

    if (app) {
      await app.close();
    }
  });

  it('deve retornar 403 em genealogia para usuario sem acesso ao animal', async () => {
    await request(app.getHttpServer()).get(`/reproducao/genealogia/${femeaAId}/analise`).set(authHeaders(ownerB.token)).expect(403);
  });

  it('deve retornar 403 em simulacao para usuario sem acesso aos animais', async () => {
    await request(app.getHttpServer())
      .post('/reproducao/simulacao')
      .set(authHeaders(ownerB.token))
      .send({
        idMacho: machoAId,
        idFemea: femeaAId,
      })
      .expect(403);
  });

  it('deve retornar 403 em predicao para usuario sem acesso ao animal', async () => {
    await request(app.getHttpServer()).post('/producao/predicao').set(authHeaders(ownerB.token)).send({ idFemea: femeaAId }).expect(403);
  });
});
