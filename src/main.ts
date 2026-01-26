import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'debug', 'error', 'verbose', 'warn'],
  });
  dotenv.config();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    }),
  );

  const swaggerDescription = `
  Documentação da API para o sistema de gerenciamento de búfalos (BUFFS).

  ## Guia Completo: Criando e Autenticando um Usuário

  Esta API é desacoplada da autenticação. O fluxo completo para um novo usuário é gerenciado pelo cliente (frontend) em conjunto com o Supabase e esta API.

  ---

  ### **Etapa 1: Cadastro (Supabase Auth)**
  O usuário se cadastra no frontend. O frontend **NÃO** chama a nossa API para isso. Ele usa o SDK do Supabase.
  - **Função a ser chamada no frontend:** \`supabase.auth.signUp({ email, password })\`
  - **Resultado:** Uma "conta de acesso" é criada no Supabase. Se a confirmação de email estiver ativa, um email será enviado.

  ---

  ### **Etapa 2: Login e Obtenção do Token (Supabase Auth)**
  Após confirmar o email (se aplicável), o usuário faz login.
  - **Função a ser chamada no frontend:** \`supabase.auth.signInWithPassword()\` ou \`signInWithOAuth({ provider: 'google' })\`
  - **Resultado:** O Supabase retorna uma sessão válida contendo um **access_token (JWT)**. Este token é a chave para acessar nossa API.

  ---

  ## 🔐 Sistema de Autenticação e Permissões

  ### **Fluxo de Autenticação**
  1. **Cadastro**: Use \`POST /auth/signup\` para criar conta no Supabase
  2. **Confirmação**: Confirme seu email (se configurado)
  3. **Login**: Use \`POST /auth/signin\` para obter o JWT token
  4. **Criar Perfil**: Use \`POST /usuarios\` com o token JWT para criar seu perfil na aplicação
  5. **Usar a API**: Inclua o header \`Authorization: Bearer <access_token>\` em todas as requisições

  ### **Sistema de Cargos e Permissões**

  | Cargo | Criar Funcionários | Gestão de Propriedade | Outras Operações |
  |-------|-------------------|----------------------|------------------|
  | **PROPRIETARIO** | ✅ Sim | ✅ Sim | ✅ Todas |
  | **GERENTE** | ✅ Sim | ❌ Não | ✅ Todas (exceto gestão propriedade) |
  | **FUNCIONARIO** | ❌ Não | ❌ Não | ✅ Operações básicas |
  | **VETERINARIO** | ❌ Não | ❌ Não | ✅ Operações básicas |

  ### **Hierarquia de Permissões**
  - **Gestão de Propriedade**: Apenas PROPRIETARIO
  - **Criação de Funcionários**: PROPRIETARIO e GERENTE
  - **Operações do Rebanho**: Todos os cargos
  - **Visualização de Dados**: Todos os cargos

  ---

  ## 🚀 Primeiros Passos

  ### **1. Para o primeiro usuário (Proprietário):**
  1. **Cadastre-se**: \`POST /auth/signup\` com email, senha e dados opcionais
  2. **Faça login**: \`POST /auth/signin\` para obter o \`access_token\`
  3. **Crie seu perfil**: \`POST /usuarios\` com o token no header - **NÃO inclua email no body**
  4. Seu perfil será criado automaticamente como **PROPRIETARIO**

  ### **2. Para criar funcionários (apenas Proprietários e Gerentes):**
  1. Faça login para obter seu JWT token
  2. Use \`POST /usuarios/funcionarios\` para criar funcionários
  3. Especifique o cargo: GERENTE, FUNCIONARIO ou VETERINARIO
  4. O funcionário poderá usar \`POST /auth/signin\` com as credenciais fornecidas

  ### **3. Renovação de Token:**
  - Use \`POST /auth/refresh\` quando o access_token expirar
  - Use \`POST /auth/signout\` para fazer logout

  ---

  ## 🥛 Sistema de Produção de Leite - Fluxo Completo

  ### **Conceitos Importantes:**

  #### **1️⃣ Ciclo de Lactação**
  **O que é:** Período que inicia quando a búfala pare e começa a produzir leite.
  - **Início:** Data do parto
  - **Fim:** Quando a búfala é secada (para de ser ordenhada)
  - **Status:** ATIVO (produzindo) ou ENCERRADO (parou de produzir)

  #### **2️⃣ Controle Leiteiro (Ordenha Individual)**
  **O que é:** Cada ordenha individual de uma búfala.
  - Registra quanto leite foi produzido por búfala em cada ordenha
  - Pode ter múltiplas ordenhas por dia (manhã, tarde, noite)
  - Vinculado a um ciclo de lactação específico

  #### **3️⃣ Estoque de Leite**
  **O que é:** Consolidação do leite produzido no dia pela propriedade.
  - Soma de todas as ordenhas do dia
  - Registrado no final do dia de produção
  - Representa o total de leite disponível

  #### **4️⃣ Coleta de Leite**
  **O que é:** Quando o laticínio vem buscar o leite na propriedade.
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

  ## 📝 Notas Importantes

  - **Autenticação**: Use os endpoints \`/auth/*\` para cadastro, login e gerenciamento de sessão
  - **Perfil**: Use \`POST /usuarios\` apenas APÓS ter feito login para criar seu perfil na aplicação
  - **Email**: NUNCA envie email no body das requisições - ele é extraído do token JWT
  - **Funcionários**: Criados via \`POST /usuarios/funcionarios\` por proprietários/gerentes
  - **Tokens**: Use sempre o \`access_token\` retornado pelo login nos headers das requisições

  ## 🔐 Autenticação em Todas as Requisições

  Todos os endpoints protegidos requerem:
  \`\`\`
  Authorization: Bearer <access_token_do_auth_signin>
  \`\`\`
  `;

  const config = new DocumentBuilder()
    .setTitle('🐃 BUFFS API')
    .setDescription(swaggerDescription)
    .setVersion('1.0')
    .addTag('Autenticação', 'Endpoints de cadastro, login e gerenciamento de sessão')
    .addTag('Usuários (Perfis)', 'Gerenciamento de perfis de usuários (proprietários e outros).')
    .addTag('Gestão de Propriedade - Propriedades', '🏠 Gerenciamento de propriedades (PROPRIETARIO apenas)')
    .addTag('Gestão de Propriedade - Lotes (Piquetes)', '🌾 Gerenciamento de lotes (PROPRIETARIO apenas)')
    .addTag('Gestão de Propriedade - Endereços', '📍 Gerenciamento de endereços (PROPRIETARIO apenas)')
    .addTag('Rebanho - Búfalos', '🐃 Gerenciamento de búfalos (todos os cargos)')
    .addTag('Produção - Lactação', '🔄 Gestão de lactação (início: parto | fim: secagem)')
    .addTag('Produção - Ordenha', '🥛 Registro de ordenhas individuais')
    .addTag('Produção - Produção Diária', '📊 Total produzido no dia')
    .addTag('Produção - Retirada', '🚚 Retirada pelo laticínio')
    .addTag('Produção - Laticínios', '🏭 Cadastro de compradores')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT obtido do endpoint /auth/signin. Exemplo: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        in: 'header',
      },
      'JWT-auth', // Este nome deve corresponder ao usado no decorator @ApiBearerAuth()
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

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API rodando em: http://0.0.0.0:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
