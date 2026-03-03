# BUFFS API

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)

API REST para gestão de rebanhos bubalinos. Cobre o ciclo completo de manejo: cadastro de animais, controle reprodutivo, produção leiteira, saúde, alimentação e alertas automáticos com classificação de prioridade por IA.

---

## Índice

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Setup](#setup)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Executando](#executando)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Módulos](#módulos)
- [Alertas e RabbitMQ](#alertas-e-rabbitmq)
- [Scheduled Jobs](#scheduled-jobs)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Health Checks](#health-checks)
- [Testes](#testes)
- [Deploy](#deploy)
- [Scripts](#scripts)

---

## Stack

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| Runtime | Node.js | >= 20 |
| Framework | NestJS | 11.x |
| Linguagem | TypeScript | 5.x |
| Banco de dados | PostgreSQL (Supabase) | Hospedado, com RLS |
| ORM | Drizzle ORM | + PostGIS |
| Autenticação | Supabase Auth | JWT + Passport |
| IA | Google Gemini 2.5 Flash | Classificação de alertas, análise reprodutiva |
| Mensageria | RabbitMQ 3.13 | Via `@nestjs/microservices` (transport RMQ nativo) |
| Documentação | Swagger / OpenAPI | `@nestjs/swagger` 11.x |
| Validação | class-validator + class-transformer | DTOs com whitelist |
| Cache | @nestjs/cache-manager | In-memory |
| Segurança | Helmet + CORS + Throttler | Rate limiting por IP |
| Agendamento | @nestjs/schedule | Cron jobs para alertas |
| HTTP Client | Axios | `@nestjs/axios` |
| Build | SWC | Compilação rápida |
| Containerização | Docker | Multi-stage build, Node 20 Alpine |
| Process Manager | PM2 | Produção (`ecosystem.config.js`) |

---

## Pré-requisitos

- **Node.js** >= 20 e **npm** >= 10
- **Docker** (para RabbitMQ local)
- Conta no **[Supabase](https://supabase.com/)** com projeto configurado
- Chave de API do **[Google Gemini](https://ai.google.dev/)** (para IA nos alertas)

---

## Setup

```bash
git clone https://github.com/AgroCore-co/dsm5-buffs-api.git
cd dsm5-buffs-api
npm install
cp env.example .env
# Edite .env com suas credenciais
```

Subir o RabbitMQ para desenvolvimento:

```bash
docker compose -f infra/docker-compose.yml up -d rabbitmq
```

---

## Variáveis de Ambiente

Veja [env.example](env.example) para a lista completa. As obrigatórias:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave anon do Supabase |
| `SUPABASE_JWT_SECRET` | JWT secret do Supabase (Settings > API) |
| `GEMINI_API_KEY` | Chave da API Google Gemini |
| `RABBITMQ_URL` | URL AMQP (padrão: `amqp://admin:admin@localhost:5672`) |
| `PORT` | Porta da API (padrão: `3001`) |
| `NODE_ENV` | `development` ou `production` |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula |

---

## Executando

```bash
# Desenvolvimento (hot-reload)
npm run start:dev

# Build + produção
npm run build
npm run start:prod
```

Swagger UI disponível em `http://localhost:3001/api`.

---

## Estrutura do Projeto

```
src/
├── core/                        # Infraestrutura compartilhada
│   ├── cache/                   # Cache in-memory
│   ├── database/                # Drizzle ORM setup
│   ├── decorators/              # Decoradores customizados
│   ├── dto/                     # DTOs base (paginação)
│   ├── gemini/                  # Client Google Gemini
│   ├── interfaces/              # Interfaces compartilhadas
│   ├── logger/                  # Logger customizado
│   ├── rabbitmq/                # RabbitMQ module (ClientProxy + bootstrap DLX)
│   ├── services/                # Serviços auxiliares (auth-helper, user-mapping)
│   ├── supabase/                # Client Supabase
│   ├── utils/                   # Utilitários (paginação, formatação, similarity)
│   └── validators/              # Validadores customizados
│
├── database/                    # Schema Drizzle + relations
│
├── modules/                     # Domínios de negócio
│   ├── alerta/                  # Alertas inteligentes + consumers RabbitMQ
│   ├── alimentacao/             # Definições e registros de alimentação
│   ├── auth/                    # Autenticação (signup, signin, refresh, signout)
│   ├── dashboard/               # Métricas e indicadores por propriedade
│   ├── gestao-propriedade/      # Endereços, propriedades, lotes/piquetes
│   ├── producao/                # Lactação, ordenhas, produção diária, retiradas, laticínios
│   ├── rebanho/                 # Búfalos, raças, grupos, movimentação de lotes
│   ├── reproducao/              # Coberturas, material genético, genealogia, simulação
│   ├── saude-zootecnia/         # Vacinação, dados sanitários, zootécnicos, medicamentos
│   └── usuario/                 # Gestão de usuários e funcionários
│
├── health/                      # Health check + RabbitMQ health indicator
├── app.module.ts
└── main.ts                      # Bootstrap HTTP + RabbitMQ (Hybrid App)
```

---

## Módulos

### Auth (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/signup-proprietario` | Cadastro de proprietário |
| POST | `/auth/signup-funcionario` | Cadastro de funcionário (requer PROPRIETARIO/GERENTE) |
| POST | `/auth/signin` | Login |
| POST | `/auth/refresh` | Renovar token |
| POST | `/auth/signout` | Logout |

### Usuários (`/usuarios`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/usuarios/me` | Perfil do usuário autenticado |
| GET | `/usuarios` | Listar usuários |
| PATCH | `/usuarios/:id` | Atualizar usuário |
| PATCH | `/usuarios/:id/cargo` | Alterar cargo |
| DELETE | `/usuarios/:id` | Remover usuário |
| GET | `/usuarios/funcionarios` | Listar funcionários |
| GET | `/usuarios/funcionarios/propriedade/:id` | Funcionários por propriedade |
| DELETE | `/usuarios/funcionarios/:id/propriedade/:id` | Desvincular funcionário |

### Gestão de Propriedade

**Endereços** (`/enderecos`), **Propriedades** (`/propriedades`), **Lotes** (`/lotes`) — CRUD completo com suporte PostGIS nos lotes.

### Rebanho

**Búfalos** (`/bufalos`) — CRUD com soft delete, filtros avançados (raça, sexo, status, maturidade, brinco), movimentação entre grupos, processamento automático de categoria ABCB.

**Raças** (`/racas`), **Grupos** (`/grupos`), **Movimentação de Lotes** (`/mov-lote`) — CRUD padrão.

### Produção

**Lactação** (`/lactacao`) — Ciclos de lactação com estatísticas por propriedade.

**Ordenhas** (`/ordenhas`) — Registro individual de ordenhas, resumo de produção por búfala, listagem de fêmeas em lactação.

**Produção Diária** (`/producao-diaria`) — Consolidação diária da produção.

**Retiradas** (`/retiradas`) — Registro de coletas pelo laticínio.

**Laticínios** (`/laticinios`) — Cadastro de compradores.

**Predição** (`POST /producao/predicao`) — Predição de produção via serviço externo de IA.

### Reprodução

**Coberturas** (`/cobertura`) — Registro de coberturas/inseminação, registro de parto (cria lactação automaticamente), fêmeas disponíveis, recomendações de cruzamento via IA.

**Material Genético** (`/material-genetico`) — CRUD completo.

**Genealogia** (`/reproducao/genealogia`) — Árvore genealógica, análise de consanguinidade via IA, machos compatíveis.

**Simulação** (`/reproducao/simulacao`) — Simulação de potencial reprodutivo.

### Saúde e Zootecnia

**Vacinação** (`/vacinacao`), **Dados Zootécnicos** (`/dados-zootecnicos`), **Medicamentos** (`/medicamentos`), **Dados Sanitários** (`/dados-sanitarios`) — CRUD completo com soft delete. Dados sanitários incluem normalização automática de nomes de doenças e sugestões de autocompletar.

### Alimentação

**Definições** (`/alimentacoes-def`) e **Registros** (`/alimentacao/registros`) — Definição de tipos de alimentação e registro de fornecimento.

### Alertas (`/alertas`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/alertas` | Criar alerta (emite evento no RabbitMQ) |
| GET | `/alertas` | Listar com filtros |
| GET | `/alertas/propriedade/:id` | Por propriedade (filtros: nichos, prioridade, incluirVistos) |
| GET | `/alertas/:id` | Buscar por ID |
| PATCH | `/alertas/:id/visto` | Marcar como visto/não visto |
| DELETE | `/alertas/:id` | Remover |
| POST | `/alertas/verificar/:id` | Verificação sob demanda (dispara domain services) |

### Dashboard (`/dashboard`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard/:id` | Estatísticas gerais da propriedade |
| GET | `/dashboard/lactacao/:id` | Métricas de lactação |
| GET | `/dashboard/producao-mensal/:id` | Produção mensal |
| GET | `/dashboard/reproducao/:id` | Métricas reprodutivas |

> Documentação interativa completa de todos os endpoints: **`http://localhost:3001/api`** (Swagger UI)

---

## Alertas e RabbitMQ

O sistema de alertas usa RabbitMQ para processar eventos de forma assíncrona, desacoplando a criação do alerta (HTTP rápido) da classificação por IA (background).

### Fluxo

```
                                         Queue: buffs.alerts
                                        ┌────────────────────┐
  AlertasService.create()               │                    │     AlertasConsumer
  ─────────────────────────             │  alerta_criado     │    ──────────────────
  1. Salva no banco         emit()      │                    │     @EventPattern
  2. Emite evento        ──────────────►│                    │────► 1. Log notificação
  3. Retorna HTTP 201                   │                    │     2. Se prioridade=null
                                        └─────────┬──────────┘        → Gemini IA classifica
                                                  │                    → Atualiza banco
                                                  │ nack (falha)    3. ack manual
                                                  ▼
                                        ┌────────────────────┐
                                        │  buffs.alerts.dlq  │
                                        │  (Dead Letter)     │
                                        └────────────────────┘
```

### Arquitetura técnica

- **Transporte**: `@nestjs/microservices` com `Transport.RMQ` (Hybrid App — HTTP + microservice no mesmo processo)
- **Queue principal**: `buffs.alerts` com DLX configurado
- **Consumer**: `AlertasConsumer` com `@EventPattern('alerta_criado')` e ack/nack manual
- **DLX/DLQ**: Exchange `buffs.dlx` (fanout) → queue `buffs.alerts.dlq`. Criados automaticamente no startup pelo `RabbitMQBootstrapService`
- **Publicação**: `ClientProxy.emit()` injetado via token `RABBITMQ_SERVICE`
- **Classificação IA**: Gemini 2.5 Flash com timeout de 10s. Se falhar, mensagem vai para DLQ (não perde)

### RabbitMQ local

```bash
# Subir
docker compose -f infra/docker-compose.yml up -d rabbitmq

# Management UI: http://localhost:15672 (admin/admin)

# Ver queues
docker exec buffs-rabbitmq rabbitmqctl list_queues name messages consumers

# Ver exchanges
docker exec buffs-rabbitmq rabbitmqctl list_exchanges name type
```

---

## Scheduled Jobs

Todos os jobs rodam via `@nestjs/schedule` e iteram sobre todas as propriedades ativas.

| Horário | Job | Descrição |
|---------|-----|-----------|
| 00:00 | `verificarTratamentos` | Tratamentos sanitários com retorno agendado |
| 00:00 | `handleMaturityUpdate` | Atualiza maturidade dos animais (Bezerro → Novilho → Vaca/Touro) |
| 00:05 | `verificarNascimentos` | Nascimentos previstos nos próximos 30 dias |
| 01:00 | `verificarCoberturaSemDiagnostico` | Coberturas sem diagnóstico há mais de 90 dias |
| 02:00 | `verificarFemeasVazias` | Fêmeas vazias há mais de 180 dias |
| 03:00 | `verificarVacinacoes` | Vacinações agendadas |
| 04:00 | `verificarQuedaProducao` | Queda significativa na produção de leite |
| 05:00 | `verificarSecagemPendente` | Vacas prenhas com secagem pendente |
| 06:00 | `verificarSinaisClinicosPrecoces` | Sinais clínicos precoces (múltiplos tratamentos, ganho de peso insuficiente) |

Os alertas gerados pelos schedulers usam `createIfNotExists()` para idempotência — não cria duplicatas se já existe alerta não visto para o mesmo evento.

---

## Autenticação e Autorização

Autenticação via **Supabase Auth** (JWT). Todas as rotas exceto `/health`, `/api` e auth público são protegidas.

```
Authorization: Bearer <access_token>
```

### Cargos e permissões

| Cargo | Criar propriedade | Gerenciar funcionários | Alterar cargos | Operações gerais |
|-------|:-:|:-:|:-:|:-:|
| PROPRIETARIO | ✓ | ✓ | ✓ | ✓ |
| GERENTE | — | ✓ | ✓ | ✓ |
| FUNCIONARIO | — | — | — | ✓ |
| VETERINARIO | — | — | — | ✓ (saúde) |

### Guards

| Guard | Função |
|-------|--------|
| `SupabaseAuthGuard` | Valida JWT |
| `RolesGuard` | Verifica cargo |
| `OnboardingGuard` | Bloqueia proprietário sem propriedade cadastrada |
| `EmailVerifiedGuard` | Exige email confirmado para operações críticas |

---

## Health Checks

### `GET /health` (público)

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "service": "BUFFS API",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "development",
  "port": 3001
}
```

### `GET /health/detailed` (autenticado)

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T10:00:00.000Z",
  "service": "BUFFS API",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "api": "running",
    "database": "supabase_configured",
    "gemini": "configured",
    "rabbitmq": {
      "status": "up",
      "connected": true,
      "message": "RabbitMQ operacional"
    }
  },
  "system": {
    "nodeVersion": "v20.x.x",
    "platform": "linux",
    "arch": "x64",
    "memory": {
      "rss": "85 MB",
      "heapTotal": "45 MB",
      "heapUsed": "32 MB",
      "external": "3 MB"
    }
  }
}
```

---

## Testes

```bash
npm run test          # Unitários
npm run test:watch    # Watch mode
npm run test:e2e      # End-to-end
npm run test:cov      # Cobertura
```

---

## Deploy

### Docker

```bash
docker build -t buffs-api .
docker run -p 3001:3001 --env-file .env buffs-api
```

### Docker Compose (produção)

```bash
docker compose -f infra/docker-compose.prod.yml up -d
```

Sobe RabbitMQ + API com rede interna. A API usa `RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672`.

### PM2

```bash
npm run build
pm2 start ecosystem.config.js --env production
```

### Variáveis de produção

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=...
SUPABASE_JWT_SECRET=...
GEMINI_API_KEY=...
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app.seudominio.com
```

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run start:debug` | Desenvolvimento com debug |
| `npm run build` | Build para produção |
| `npm run start:prod` | Execução do build (`node dist/main`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Jest |
| `npm run test:e2e` | Testes end-to-end |
| `npm run test:cov` | Cobertura de testes |

---

## Contato

- **Email**: buffsapp@gmail.com
- **Issues**: [GitHub Issues](https://github.com/AgroCore-co/dsm5-buffs-api/issues)

---

Desenvolvido por [AgroCore](https://github.com/AgroCore-co)
