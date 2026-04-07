import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { RabbitMQQueues, DLX_EXCHANGE, RABBITMQ_DEFAULT_URL } from './core/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'debug', 'error', 'verbose', 'warn'],
  });

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
# BUFFS API - Guia Operacional (alinhado ao SDD)

API para gestao rural multi-tenant com foco em propriedade, rebanho, reproducao, saude, producao, alertas e ingestao de dados.

Este Swagger foi reorganizado com base em \`docs/specs\` para facilitar onboarding tecnico e uso diario pelo time.

---

## Fonte oficial das regras de negocio

- \`docs/specs/README.md\`

- \`docs/specs/auth\`

- \`docs/specs/usuario\`

- \`docs/specs/gestao-propriedade\`

- \`docs/specs/rebanho\`

- \`docs/specs/reproducao\`

- \`docs/specs/saude-zootecnia\`

- \`docs/specs/alimentacao\`

- \`docs/specs/producao\`

- \`docs/specs/alerta\`

- \`docs/specs/data-ingestion\`

- \`docs/specs/dashboard\`

---

## Inicio rapido para um novo tenant

1. \`POST /auth/signup-proprietario\` para criar conta.

2. \`POST /auth/signin\` para obter \`access_token\`.

3. \`POST /enderecos\` para cadastrar endereco base.

4. \`POST /propriedades\` para criar a propriedade.

5. \`POST /auth/signup-funcionario\` para criar equipe (quando aplicavel).

Todos os endpoints protegidos exigem header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

---

## Regras transversais da API

- Autenticacao e sessao: \`/auth/signin\`, \`/auth/refresh\`, \`/auth/signout\`.

- Autorizacao por cargo: PROPRIETARIO, GERENTE, FUNCIONARIO e VETERINARIO.

- Escopo multi-tenant por propriedade em fluxos operacionais.

- Validacao global com \`ValidationPipe\` (whitelist, forbidNonWhitelisted, transform).

- Padrao de soft delete em varios subdominios com endpoint de restore quando suportado.

- Processamento assincrono de alertas via RabbitMQ (ack/nack manual, DLX/DLQ).

---

## Fluxos funcionais principais

### Propriedade e acesso
- \`/enderecos\`, \`/propriedades\`, \`/lotes\` para estrutura da fazenda.

- \`/usuarios\` e \`/usuarios/funcionarios\` para perfil, cargo e vinculos.

### Rebanho
- \`/bufalos\`, \`/grupos\`, \`/racas\`, \`/mov-lote\`.

- Regras relevantes: maturidade automatica, genealogia e categoria ABCB.

### Reproducao e genetica
- \`/cobertura\`, \`/material-genetico\`, \`/reproducao/genealogia\`, \`/reproducao/simulacao\`.

- Regras relevantes: validacoes zootecnicas por tecnica, recomendacao de femeas (IAR) e machos (IVR), simulacao assistida por IA.

### Saude e zootecnia
- \`/dados-sanitarios\`, \`/dados-zootecnicos\`, \`/medicamentos\`, \`/vacinacao\`.

- Regras relevantes: normalizacao de doenca, historico clinico e integracao com alertas clinicos.

### Alimentacao
- \`/alimentacoes-def\` e \`/alimentacao/registros\`.

- Regras relevantes: consistencia entre propriedade, grupo e definicao de alimentacao.

### Producao de leite
- \`/lactacao\` -> \`/ordenhas\` -> \`/producao-diaria\` -> \`/retiradas\`.

- \`/laticinios\` para gestao de compradores e \`/producao/predicao\` para predicao assistida por IA.

### Alertas e monitoramento
- \`/alertas\` para criacao, listagem e tratamento.

- Regras relevantes: idempotencia por evento de origem, verificacoes automaticas por nicho e classificacao assincrona via IA.

### Data ingestion (ETL)
- Base: \`/propriedades/:propriedadeId/data-ingestion\` e status em \`/data-ingestion/jobs/:jobId\`.

- Regras relevantes: importacao aceita somente XLSX; limite de 50 MB por arquivo; rate limit de 10 importacoes por propriedade a cada 1 hora; limpeza de uploads temporarios as 01:00 para arquivos com mais de 24h.

### Dashboard
\`/dashboard\` para indicadores consolidados de rebanho, lactacao, producao e reproducao.

---

## Erros comuns e leitura rapida

- \`400\`: validacao de entrada/contrato.

- \`401\`: token ausente, invalido ou expirado.

- \`403\`: sem permissao por cargo/escopo.

- \`404\`: recurso nao encontrado.

- \`409\`: conflito de estado (quando aplicavel).

- \`422\`: regra de arquivo/negocio invalida (ex.: ingestao).

- \`429\`: limite de requisicoes excedido.

- \`500\`: erro interno nao esperado.

- \`503\`: dependencia externa indisponivel (ex.: ETL/IA).

---

## Observabilidade e saude

- Health check em \`/health\`.

- Ambiente hibrido HTTP + RabbitMQ consumer para processamento de alertas.

**Stack:** NestJS + PostgreSQL + Supabase Auth + Drizzle ORM + RabbitMQ
  `;

  const config = new DocumentBuilder()
    .setTitle('🐃 BUFFS API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addTag('Health', 'Status de disponibilidade da API e dependencias')
    .addTag('Autenticação', 'Cadastro, login e sessão')
    .addTag('Usuários', 'Gestao de perfil, funcionarios, cargos e vinculos')
    .addTag('Gestão de Propriedade - Endereços', 'Endereços das propriedades')
    .addTag('Gestão de Propriedade - Propriedades', 'Propriedades rurais')
    .addTag('Gestão de Propriedade - Lotes (Piquetes)', 'Lotes e piquetes')
    .addTag('Rebanho - Búfalos', 'Gestao de bufalos, filtros, genealogia e categoria ABCB')
    .addTag('Rebanho - Grupos', 'Gestao de grupos de manejo')
    .addTag('Rebanho - Raças', 'Catalogo de racas do rebanho')
    .addTag('Rebanho - Movimentação de Lotes', 'Movimentacao de grupos entre lotes')
    .addTag('Reprodução - Cobertura', 'Coberturas, status reprodutivo e parto')
    .addTag('Reprodução - Material Genético', 'Gestao de material genetico com soft delete')
    .addTag('IA - Genealogia', 'Analise genealogica e consanguinidade via IA')
    .addTag('IA - Simulação', 'Simulacao de acasalamento e compatibilidade genetica')
    .addTag('Produção - Lactação', 'Ciclos de lactação')
    .addTag('Produção - Ordenha', 'Registro de ordenhas')
    .addTag('Produção - Produção Diária', 'Consolidação diária')
    .addTag('Produção - Retirada', 'Coleta pelo laticínio')
    .addTag('Produção - Laticínios', 'Cadastro de compradores')
    .addTag('IA - Predição de Produção', 'Predicao de producao leiteira assistida por IA')
    .addTag('Saúde/Zootecnia - Dados Sanitários', 'Historico sanitario e tratamentos')
    .addTag('Saúde/Zootecnia - Dados Zootécnicos', 'Registros zootecnicos e metricas de campo')
    .addTag('Saúde/Zootecnia - Medicamentos', 'Catalogo de medicamentos por propriedade')
    .addTag('Saúde/Zootecnia - Vacinação', 'Aplicacao e historico de vacinacao')
    .addTag('Alimentação - Definições', 'Definicoes de alimentacao por propriedade')
    .addTag('Alimentação - Registros', 'Registros operacionais de alimentacao')
    .addTag('Data Ingestion', 'Importacao/exportacao ETL por propriedade e acompanhamento de jobs')
    .addTag('Alertas', 'Alertas operacionais com verificacao automatica e classificacao por IA')
    .addTag('Dashboard', 'Indicadores consolidados de propriedade')
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

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando em: http://0.0.0.0:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🐰 RabbitMQ consumer ativo na queue: ${RabbitMQQueues.ALERTS}`);
}
bootstrap().catch((error) => {
  console.error('Erro ao iniciar a aplicação', error);
  process.exit(1);
});
