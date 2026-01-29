import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Helper para setup de testes E2E
 *
 * **Responsabilidades:**
 * - Autenticação (obter JWT token)
 * - Criar dados de teste
 * - Limpar dados após testes
 * - Utilitários comuns
 */

export interface TestUser {
  email: string;
  password: string;
  nome: string;
  telefone: string;
  token?: string;
  userId?: string;
}

export class TestSetup {
  static createdResources: {
    bufalos: string[];
    propriedades: string[];
    racas: string[];
    grupos: string[];
  } = {
    bufalos: [],
    propriedades: [],
    racas: [],
    grupos: [],
  };

  /**
   * Cria um usuário de teste e faz login
   */
  static async createAuthenticatedUser(app: INestApplication): Promise<TestUser> {
    const timestamp = Date.now();
    const testUser: TestUser = {
      email: `test.e2e.${timestamp}@example.com`,
      password: 'Test@123456',
      nome: 'Usuário Teste E2E',
      telefone: '11999999999',
    };

    try {
      console.log('🔐 Tentando criar usuário de teste:', testUser.email);

      // Tenta criar usuário via Supabase Auth (endpoint para proprietário)
      const signupResponse = await request(app.getHttpServer()).post('/auth/signup-proprietario').send({
        email: testUser.email,
        password: testUser.password,
        nome: testUser.nome,
        telefone: testUser.telefone,
      });

      console.log('📝 Resposta do signup:', signupResponse.status, signupResponse.body);

      if (signupResponse.status === 201 || signupResponse.status === 200) {
        // Login para obter token
        const loginResponse = await request(app.getHttpServer()).post('/auth/signin').send({
          email: testUser.email,
          password: testUser.password,
        });

        console.log('🔑 Resposta do signin:', loginResponse.status, loginResponse.body);

        testUser.token = loginResponse.body.access_token;
        testUser.userId = loginResponse.body.user?.id;

        console.log('✅ Usuário autenticado:', { email: testUser.email, hasToken: !!testUser.token });
      }
    } catch (error) {
      console.error('❌ Erro ao criar usuário de teste:', error);
    }

    return testUser;
  }

  /**
   * Cria uma propriedade de teste
   */
  static async createTestPropriedade(app: INestApplication, token: string): Promise<string | null> {
    try {
      // Primeiro cria um endereço
      const enderecoResponse = await request(app.getHttpServer()).post('/enderecos').set('Authorization', `Bearer ${token}`).send({
        pais: 'Brasil',
        estado: 'SP',
        cidade: 'São Paulo',
        cep: '01310-000',
        rua: 'Avenida Paulista',
        numero: '1000',
      });

      console.log('📍 Resposta do endereço:', enderecoResponse.status, enderecoResponse.body);

      if (enderecoResponse.status !== 201) {
        console.error('❌ Falha ao criar endereço');
        return null;
      }

      const idEndereco = enderecoResponse.body.idEndereco || enderecoResponse.body.id_endereco || enderecoResponse.body.id;

      // Cria a propriedade
      const propriedadeData = {
        nome: 'Fazenda Teste E2E',
        cnpj: '12.345.678/0001-90',
        id_endereco: idEndereco,
        p_abcb: false,
        tipo_manejo: 'P',
      };

      console.log('🏠 Criando propriedade com dados:', propriedadeData);

      const propriedadeResponse = await request(app.getHttpServer())
        .post('/propriedades')
        .set('Authorization', `Bearer ${token}`)
        .send(propriedadeData);

      console.log('🏠 Resposta da propriedade:', propriedadeResponse.status, propriedadeResponse.body);

      if (propriedadeResponse.status !== 201) {
        console.error('❌ Falha ao criar propriedade');
        return null;
      }

      const propriedadeId = propriedadeResponse.body.idPropriedade || propriedadeResponse.body.id_propriedade || propriedadeResponse.body.id;
      this.createdResources.propriedades.push(propriedadeId);
      return propriedadeId;
    } catch (error) {
      console.error('Erro ao criar propriedade de teste:', error);
      return null;
    }
  }

  /**
   * Cria uma raça de teste
   */
  static async createTestRaca(app: INestApplication, token: string): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post('/racas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: `Murrah Teste ${timestamp}`,
        });

      console.log('🐃 Resposta da raça:', response.status, response.body);

      if (response.status !== 201) {
        console.error('❌ Falha ao criar raça');
        return null;
      }

      const racaId = response.body.idRaca || response.body.id_raca || response.body.id;
      this.createdResources.racas.push(racaId);
      return racaId;
    } catch (error) {
      console.error('Erro ao criar raça de teste:', error);
      return null;
    }
  }

  /**
   * Cria um búfalo de teste
   */
  static async createTestBufalo(
    app: INestApplication,
    token: string,
    data: {
      nome: string;
      sexo: 'M' | 'F';
      dt_nascimento: string;
      id_propriedade: string;
      id_raca: string;
      id_pai?: string;
      id_mae?: string;
    },
  ): Promise<any> {
    try {
      const response = await request(app.getHttpServer()).post('/bufalos').set('Authorization', `Bearer ${token}`).send(data).expect(201);

      const bufaloId = response.body.idBufalo || response.body.id;
      this.createdResources.bufalos.push(bufaloId);
      return response.body;
    } catch (error) {
      console.error('Erro ao criar búfalo de teste:', error);
      return null;
    }
  }

  /**
   * Limpa todos os recursos criados durante os testes
   */
  static async cleanup(app: INestApplication, token: string): Promise<void> {
    // Limpa búfalos
    for (const bufaloId of this.createdResources.bufalos) {
      try {
        await request(app.getHttpServer()).delete(`/bufalos/${bufaloId}`).set('Authorization', `Bearer ${token}`);
      } catch (error) {
        // Ignora erros de limpeza
      }
    }

    // Limpa propriedades
    for (const propId of this.createdResources.propriedades) {
      try {
        await request(app.getHttpServer()).delete(`/propriedades/${propId}`).set('Authorization', `Bearer ${token}`);
      } catch (error) {
        // Ignora erros de limpeza
      }
    }

    // Limpa raças
    for (const racaId of this.createdResources.racas) {
      try {
        await request(app.getHttpServer()).delete(`/racas/${racaId}`).set('Authorization', `Bearer ${token}`);
      } catch (error) {
        // Ignora erros de limpeza
      }
    }

    // Reseta arrays
    this.createdResources = {
      bufalos: [],
      propriedades: [],
      racas: [],
      grupos: [],
    };
  }

  /**
   * Aguarda um tempo (útil para testes de cache)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
