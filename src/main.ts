import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { RabbitMQQueues, DLX_EXCHANGE, RABBITMQ_DEFAULT_URL } from './core/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'debug', 'error', 'verbose', 'warn'],
  });
  dotenv.config();

  // ── RabbitMQ Microservice (Hybrid App) ────────────────────────────
  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', RABBITMQ_DEFAULT_URL);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: RabbitMQQueues.ALERTS,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': DLX_EXCHANGE,
        },
      },
      noAck: false, // ack/nack manual para controle de resiliência
      prefetchCount: 1,
    },
  });
  // ──────────────────────────────────────────────────────────────────

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    }),
  );

  const swaggerDescription = `
# BUFFS API - Sistema de Gerenciamento de Búfalos

API para gestão de propriedades rurais, rebanhos e produção de leite.

---

## Início Rápido

### 1. Criar Conta
\`\`\`json
POST /auth/signup-proprietario
{
  "email": "proprietario@fazenda.com",
  "password": "senha123",
  "nome": "João Silva",
  "telefone": "27999887766"
}
\`\`\`
Retorna: \`access_token\` (use nos próximos passos)

### 2. Criar Endereço
\`\`\`json
POST /enderecos
Authorization: Bearer <token>
{
  "logradouro": "Rodovia BR-101",
  "cidade": "Cachoeiro de Itapemirim",
  "estado": "ES",
  "cep": "29300-000"
}
\`\`\`
Retorna: \`idEndereco\` (use no próximo passo)

### 3. Criar Propriedade
\`\`\`json
POST /propriedades
Authorization: Bearer <token>
{
  "nome": "Fazenda São João",
  "area_hectares": 250.5,
  "id_endereco": "<idEndereco>"
}
\`\`\`
Sistema pronto para uso

---

## Autenticação

Todos os endpoints (exceto signup/signin) requerem:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Login:** \`POST /auth/signin\`  

**Refresh:** \`POST /auth/refresh\` (token expira em 1h)  

**Logout:** \`POST /auth/signout\`

---

## Permissões por Cargo

| Cargo | Criar Propriedade | Criar Funcionários | Alterar Cargos | Operações Gerais |
|-------|------------------|-------------------|----------------|------------------|
| PROPRIETARIO | ✅ | ✅ | ✅ | ✅ |
| GERENTE | ❌ | ✅ | ✅ | ✅ |
| FUNCIONARIO | ❌ | ❌ | ❌ | ✅ |
| VETERINARIO | ❌ | ❌ | ❌ | ✅ (saúde apenas) |

**Criar Funcionário:** \`POST /auth/signup-funcionario\` (PROPRIETARIO/GERENTE)  
**Alterar Cargo:** \`PATCH /usuarios/{id}/cargo\` (PROPRIETARIO/GERENTE)

---

## Segurança

**Rate Limiting:**
- Signup: 3-5 req/min
- Geral: 10 req/min
- Resposta: HTTP 429

**Guards:**
- \`SupabaseAuthGuard\`: Valida JWT

- \`RolesGuard\`: Verifica permissões por cargo

- \`OnboardingGuard\`: Bloqueia proprietário sem propriedade

- \`EmailVerifiedGuard\`: Requer email confirmado (ops críticas)

---

## Fluxo de Produção

**Diário:**
1. \`POST /lactacao\` - Iniciar ciclo após parto

2. \`POST /ordenhas\` - Registrar ordenhas (2-3x/dia)

3. \`POST /producao-diaria\` - Consolidar fim do dia

4. \`POST /retiradas\` - Registrar coleta do laticínio

---

## Troubleshooting

**401 Unauthorized:** Token ausente/expirado → use \`/auth/refresh\`  

**403 Forbidden:** Cargo sem permissão → veja matriz acima  

**403 Onboarding:** Proprietário sem propriedade → crie endereço + propriedade  

**429 Too Many Requests:** Aguarde 60s

---

**Stack:** NestJS v10 + PostgreSQL + Supabase Auth + Drizzle ORM

  ---

  ## Sistema de Produção de Leite - Fluxo Completo

  ### Conceitos Importantes:

  #### 1. Ciclo de Lactação
  Período que inicia quando a búfala pare e começa a produzir leite.
  - Início: Data do parto
  - Fim: Quando a búfala é secada (para de ser ordenhada)
  - Status: ATIVO (produzindo) ou ENCERRADO (parou de produzir)

  #### 2. Controle Leiteiro (Ordenha Individual)
  Cada ordenha individual de uma búfala.
  - Registra quanto leite foi produzido por búfala em cada ordenha
  - Pode ter múltiplas ordenhas por dia (manhã, tarde, noite)
  - Vinculado a um ciclo de lactação específico

  #### 3. Estoque de Leite
  Consolidação do leite produzido no dia pela propriedade.
  - Soma de todas as ordenhas do dia
  - Registrado no final do dia de produção
  - Representa o total de leite disponível

  #### 4. Coleta de Leite
  Quando o laticínio vem buscar o leite na propriedade.
  - Retira leite do estoque
  - Gera receita para a propriedade
  - Registra quantidade coletada e valor pago

  ### **Fluxo de Trabalho Diário:**

  \`\`\`
  MANHÃ:
  1. Ordenha individual das búfalas → POST /lactacao (Controle Leiteiro)
  
  TARDE:
  2. Ordenha individual das búfalas → POST /lactacao (Controle Leiteiro)
  
  FIM DO DIA:
  3. Consolidar produção do dia → POST /producao-diaria
  
  QUANDO O LATICÍNIO CHEGAR:
  4. Registrar retirada → POST /retiradas
  \`\`\`

  ### **Endpoints Organizados por Ordem de Uso:**

  **1. Gestão de Lactação (Após Parto)**

  - \`POST /lactacao\` - Iniciar novo período de lactação após parto

  - \`GET /lactacao/propriedade/:id\` - Ver períodos ativos

  **2. Ordenha Diária (2-3x por dia)**

  - \`POST /ordenhas\` - Registrar cada ordenha individual

  - \`GET /ordenhas/femeas/em-lactacao/:id_propriedade\` - Ver búfalas em lactação

  **3. Consolidação Diária (Fim do dia)**

  - \`POST /producao-diaria\` - Consolidar produção do dia

  - \`GET /producao-diaria/propriedade/:id\` - Ver produção disponível

  **4. Retirada pelo Laticínio (Conforme agendamento)**

  - \`POST /retiradas\` - Registrar retirada pelo laticínio

  - \`GET /retiradas/propriedade/:id\` - Histórico de retiradas

  ---

  ## � Autenticação em Todas as Requisições

  Todos os endpoints protegidos requerem:
  \`\`\`
  Authorization: Bearer <access_token>
  \`\`\`

  **Obtendo o access_token:**

  - Cadastro: \`POST /auth/signup-proprietario\` retorna o token

  - Login: \`POST /auth/signin\` retorna o token
  
  - Refresh: \`POST /auth/refresh\` renova o token expirado

  ---

  ## 📚 Documentação Completa

  Para informações detalhadas sobre o sistema, consulte:
**Stack:** NestJS v10 + PostgreSQL + Supabase Auth + Drizzle ORM
  `;

  const config = new DocumentBuilder()
    .setTitle('🐃 BUFFS API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addTag('Autenticação', 'Cadastro, login e sessão')
    .addTag('Usuários', 'Gerenciamento de perfis')
    .addTag('Gestão de Propriedade - Endereços', 'Endereços das propriedades')
    .addTag('Gestão de Propriedade - Propriedades', 'Propriedades rurais')
    .addTag('Gestão de Propriedade - Lotes (Piquetes)', 'Lotes e piquetes')
    .addTag('Rebanho - Búfalos', 'Gestão do rebanho')
    .addTag('Produção - Lactação', 'Ciclos de lactação')
    .addTag('Produção - Ordenha', 'Registro de ordenhas')
    .addTag('Produção - Produção Diária', 'Consolidação diária')
    .addTag('Produção - Retirada', 'Coleta pelo laticínio')
    .addTag('Produção - Laticínios', 'Cadastro de compradores')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT obtido de /auth/signin',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 🌐 Configuração de CORS mais segura
  const corsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins =
    corsOrigin === '*'
      ? [] // Array vazio quando * é usado
      : corsOrigin
        ? corsOrigin.split(',').map((origin) => origin.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'http://0.0.0.0:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      // Se CORS_ORIGIN for '*', permitir qualquer origem
      if (corsOrigin === '*') {
        return callback(null, true);
      }

      // Permitir requisições sem origin (como mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`🚫 CORS bloqueou origem: ${origin}`);
        console.log(`✅ Origens permitidas: ${allowedOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: corsOrigin !== '*', // Desabilitar credentials quando * é usado
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Graceful shutdown para AWS App Runner
  app.enableShutdownHooks();

  // Iniciar consumers RabbitMQ + servidor HTTP
  await app.startAllMicroservices();

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando em: http://0.0.0.0:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🐰 RabbitMQ consumer ativo na queue: ${RabbitMQQueues.ALERTS}`);
}
bootstrap();
