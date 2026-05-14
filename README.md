# BUFFS API

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

API REST para gestão de rebanhos bubalinos. Cobre o ciclo completo de manejo: cadastro de animais, controle reprodutivo, produção leiteira, saúde, alimentação e alertas automáticos com classificação por IA.

</div>

---

## Índice

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Rodando localmente](#rodando-localmente)
- [Rodando com Docker](#rodando-com-docker)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Módulos](#módulos)
- [Alertas e RabbitMQ](#alertas-e-rabbitmq)
- [Jobs Agendados](#jobs-agendados)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Health Checks](#health-checks)
- [Testes](#testes)
- [Deploy](#deploy)

---

## Arquitetura

<!-- Insira aqui a imagem da arquitetura -->
<!-- ![Arquitetura BUFFS](./docs/architecture.png) -->

> _Diagrama de arquitetura em breve._

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Runtime | Node.js | >= 20 |
| Framework | NestJS | 11.x |
| Linguagem | TypeScript | 5.x |
| Banco de Dados | PostgreSQL via Supabase | Hospedado + RLS |
| ORM | Drizzle ORM | + PostGIS |
| Autenticação | Supabase Auth | JWT + Passport |
| IA | Google Gemini 2.5 Flash | Classificação de alertas |
| Mensageria | RabbitMQ 3.13 | `@nestjs/microservices` |
| Documentação | Swagger / OpenAPI | `@nestjs/swagger` 11.x |
| Validação | class-validator + class-transformer | — |
| Cache | `@nestjs/cache-manager` | In-memory |
| Segurança | Helmet + CORS + Throttler | Rate limiting por IP |
| Agendamento | `@nestjs/schedule` | Cron jobs |
| ETL | buffs-etl-worker (Go) | Importação/exportação XLSX |
| Build | SWC | Compilação rápida |
| Containerização | Docker | Multi-stage, Node 20 Alpine |

---

## Pré-requisitos

- **Node.js** >= 20 e **npm** >= 10
- **Docker** e **Docker Compose**
- Conta no [Supabase](https://supabase.com/) com projeto configurado
- Chave de API do [Google Gemini](https://ai.google.dev/)

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/AgroCore-co/buffs-api.git
cd buffs-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais. Consulte a seção [Variáveis de Ambiente](#variáveis-de-ambiente) para detalhes.

---

## Rodando localmente

### Suba o RabbitMQ

O projeto precisa do RabbitMQ para o sistema de alertas assíncrono. Suba-o com Docker:

```bash
docker compose -f infra/docker-compose.yml up -d rabbitmq
```

Verifique se está saudável:

```bash
docker compose -f infra/docker-compose.yml ps
# ou acesse: http://localhost:15672 (admin/admin)
```

### Inicie a API em modo de desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3001`.  
A documentação Swagger estará em `http://localhost:3001/api`.

### Outros comandos úteis

```bash
# Build para produção
npm run build

# Executar o build compilado
npm run start:prod

# Modo debug
npm run start:debug

# Lint
npm run lint

# Formatar código
npm run format
```

---

## Rodando com Docker

### Ambiente completo (produção local)

O `docker-compose.prod.yml` sobe toda a stack: RabbitMQ, API, ETL Worker (Go) e serviço de IA (FastAPI).

```bash
# Na raiz do projeto
docker compose -f infra/docker-compose.prod.yml up -d
```

### Somente a API

```bash
docker build -t buffs-api .
docker run -p 3001:3001 --env-file .env buffs-api
```

### Gerenciamento da stack local

```bash
# Ver status dos serviços
docker compose -f infra/docker-compose.yml ps

# Ver logs em tempo real
docker compose -f infra/docker-compose.yml logs -f

# Logs de um serviço específico
docker compose -f infra/docker-compose.yml logs -f rabbitmq

# Parar todos os serviços
docker compose -f infra/docker-compose.yml down

# Parar e remover volumes (⚠️ apaga dados persistidos)
docker compose -f infra/docker-compose.yml down -v
```

---

## Variáveis de Ambiente

Copie o `.env.example` e preencha as variáveis obrigatórias:

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `SUPABASE_KEY` | ✅ | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave de service role do Supabase |
| `SUPABASE_JWT_SECRET` | ✅ | JWT secret (Settings > API no Supabase) |
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL (pooler) |
| `DIRECT_URL` | ✅ | Connection string direta (para migrações) |
| `GEMINI_API_KEY` | ✅ | Chave da API Google Gemini |
| `RABBITMQ_URL` | ✅ | URL AMQP — padrão: `amqp://admin:admin@localhost:5672` |
| `ETL_BASE_URL` | ✅ | URL do worker ETL Go — padrão: `http://localhost:8081` |
| `ETL_INTERNAL_KEY` | ✅ | Chave interna (`X-Internal-Key`) para o ETL |
| `IA_API_URL` | ✅ | URL do serviço de predição (buffs-ia) |
| `PORT` | — | Porta da API — padrão: `3001` |
| `NODE_ENV` | — | `development` ou `production` |
| `CORS_ORIGIN` | — | Origens permitidas, separadas por vírgula |

---

## Estrutura do Projeto

```
buffs-api/
├── src/
│   ├── core/                        # Infraestrutura compartilhada
│   │   ├── cache/                   # Cache in-memory + constantes de TTL
│   │   ├── database/                # Drizzle ORM + pool de conexão
│   │   ├── decorators/              # Decoradores customizados (ToBoolean, etc.)
│   │   ├── dto/                     # DTOs base (paginação)
│   │   ├── gemini/                  # Cliente Google Gemini
│   │   ├── guards/                  # Guards compartilhados (PropertyExists)
│   │   ├── interfaces/              # Interfaces transversais (ISoftDelete)
│   │   ├── logger/                  # Logger customizado estruturado
│   │   ├── rabbitmq/                # ClientProxy + bootstrap de DLX/DLQ
│   │   ├── services/                # AuthHelperService, UserMappingService
│   │   ├── supabase/                # Cliente Supabase (normal + admin)
│   │   ├── utils/                   # Paginação, datas, erros, similaridade
│   │   └── validators/              # Validadores de data, mensagens padronizadas
│   │
│   ├── database/                    # Schema Drizzle + relations
│   │
│   ├── modules/                     # Domínios de negócio
│   │   ├── alerta/                  # Alertas + consumers RabbitMQ + schedulers
│   │   ├── alimentacao/             # Definições e registros de alimentação
│   │   ├── auth/                    # Autenticação JWT + guards + facade de cadastro
│   │   ├── dashboard/               # Métricas e indicadores por propriedade
│   │   ├── data-ingestion/          # Importação/exportação XLSX via ETL Worker
│   │   ├── gestao-propriedade/      # Endereços, propriedades e lotes/piquetes
│   │   ├── producao/                # Lactação, ordenhas, estoque, retiradas e IA
│   │   ├── rebanho/                 # Búfalos, raças, grupos e movimentação de lote
│   │   ├── reproducao/              # Coberturas, genealogia, material genético e simulação
│   │   ├── saude-zootecnia/         # Vacinação, dados sanitários, zootécnicos e medicamentos
│   │   ├── sync/                    # Sincronização offline-first para mobile
│   │   └── usuario/                 # Gestão de usuários e funcionários
│   │
│   ├── health/                      # Health check endpoint
│   ├── app.module.ts
│   ├── app.consumer.module.ts       # Módulo isolado do consumer RabbitMQ
│   └── main.ts                      # Bootstrap HTTP + microserviço RMQ (Hybrid App)
│
├── drizzle/                         # Migrações SQL
├── infra/                           # Docker Compose (local e produção)
├── test/                            # Testes e2e
├── docs/specs/                      # Software Design Document (SDD) por módulo
├── Dockerfile
└── .env.example
```

---

## Módulos

### Auth (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/signup-proprietario` | Cadastro de proprietário |
| `POST` | `/auth/signup-funcionario` | Cadastro de funcionário (PROPRIETARIO/GERENTE) |
| `POST` | `/auth/signin` | Login |
| `POST` | `/auth/refresh` | Renovar token |
| `POST` | `/auth/signout` | Logout |

### Rebanho

**Búfalos** (`/bufalos`) — CRUD com soft delete, filtros avançados (raça, sexo, status, maturidade, brinco), genealogia, movimentação em lote e atualização automática de maturidade via scheduler.

**Raças** (`/racas`), **Grupos** (`/grupos`), **Movimentação de Lote** (`/mov-lote`) — CRUD com soft delete e controle de ownership por propriedade.

### Reprodução

**Coberturas** (`/cobertura`) — Registro com validações zootécnicas, parto, recomendações de cruzamento (IAR para fêmeas / IVR com ajuste bayesiano para machos).

**Genealogia** (`/reproducao/genealogia`) — Árvore genealógica recursiva, análise de consanguinidade e machos compatíveis via IA.

**Material Genético** (`/material-genetico`) — CRUD com validações cruzadas por origem (Coleta Própria / Compra).

**Simulação** (`/reproducao/simulacao`) — Predição de potencial genético via IA externa.

### Produção

**Lactação** (`/lactacao`), **Ordenhas** (`/ordenhas`), **Produção Diária** (`/producao-diaria`), **Retiradas** (`/retiradas`), **Laticínios** (`/laticinios`) — Ciclo completo de produção leiteira com soft delete.

**Predição** (`POST /producao/predicao`) — Predição de produção individual via serviço de IA com timeout de 30s.

### Saúde e Zootecnia

**Vacinação** (`/vacinacao`), **Dados Zootécnicos** (`/dados-zootecnicos`), **Medicamentos** (`/medicamentos`), **Dados Sanitários** (`/dados-sanitarios`) — CRUD com normalização automática de nomes de doenças e geração de alertas clínicos para diagnósticos graves.

### Data Ingestion (`/propriedades/:id/data-ingestion`)

Importação e exportação de planilhas XLSX via ETL Worker (Go), com rate limit de 10 req/hora por propriedade.

| Operação | Domínios disponíveis |
|----------|---------------------|
| `POST` (importar) | `leite`, `pesagem`, `reproducao` |
| `GET` (exportar) | `leite`, `pesagem`, `reproducao` |
| `GET /data-ingestion/jobs/:jobId` | Status de processamento assíncrono |

### Dashboard (`/dashboard`)

Estatísticas gerais, métricas de lactação, produção mensal e reprodução por propriedade, com cache de leitura.

### Sync (`/sync/:id_propriedade`)

Endpoints de sincronização offline-first para o app mobile, incluindo todos os domínios de negócio com payload padronizado (`data` + `meta`).

---

## Alertas e RabbitMQ

O sistema de alertas desacopla a criação (HTTP síncrono) da classificação por IA (processamento assíncrono).

```
  AlertasService.create()
  ────────────────────────      Queue: buffs.alerts
  1. Salva no banco        ──►  alerta_criado  ──►  AlertasConsumer
  2. Emite evento                                    1. Classifica via Gemini (timeout 10s)
  3. Retorna HTTP 201                                2. Atualiza prioridade no banco
                                                     3. ack / nack → DLQ (buffs.alerts.dlq)
```

**Configuração local do RabbitMQ:**

```bash
# Subir
docker compose -f infra/docker-compose.yml up -d rabbitmq

# Management UI
open http://localhost:15672  # admin / admin

# Inspecionar filas
docker exec buffs-rabbitmq rabbitmqctl list_queues name messages consumers

# Inspecionar exchanges
docker exec buffs-rabbitmq rabbitmqctl list_exchanges name type
```

---

## Jobs Agendados

Todos os jobs rodam via `@nestjs/schedule` e iteram sobre todas as propriedades ativas.

| Horário | Job | Nicho |
|---------|-----|-------|
| `00:00` | Tratamentos com retorno agendado | SANITÁRIO |
| `00:00` | Atualização de maturidade dos animais | — |
| `00:05` | Nascimentos previstos (próximos 30 dias) | REPRODUÇÃO |
| `01:00` | Limpeza de uploads temporários (`temp/uploads/`) | — |
| `01:00` | Coberturas sem diagnóstico há +90 dias | REPRODUÇÃO |
| `02:00` | Fêmeas vazias há +180 dias | REPRODUÇÃO |
| `03:00` | Vacinações agendadas | SANITÁRIO |
| `04:00` | Queda de produção leiteira (≥20% em 7 dias) | PRODUÇÃO |
| `05:00` | Secagem pendente em gestantes | MANEJO |
| `06:00` | Sinais clínicos precoces (múltiplos tratamentos / ganho insuficiente) | CLÍNICO |

---

## Autenticação e Autorização

Autenticação via **Supabase Auth (JWT)**. Todas as rotas — exceto `/health`, `/api` e os endpoints públicos de auth — são protegidas.

```http
Authorization: Bearer <access_token>
```

### Cargos

| Cargo | Criar propriedade | Gerenciar funcionários | Alterar cargos | Operações gerais |
|-------|:-:|:-:|:-:|:-:|
| `PROPRIETARIO` | ✅ | ✅ | ✅ | ✅ |
| `GERENTE` | — | ✅ | ✅ | ✅ |
| `FUNCIONARIO` | — | — | — | ✅ |
| `VETERINARIO` | — | — | — | ✅ (saúde) |

### Guards disponíveis

| Guard | Responsabilidade |
|-------|-----------------|
| `SupabaseAuthGuard` | Valida JWT via Passport |
| `RolesGuard` | Verifica cargo via metadata `@Roles` |
| `PropertyExistsGuard` | Valida existência da propriedade no banco |
| `OnboardingGuard` | Bloqueia proprietário sem propriedade cadastrada |
| `EmailVerifiedGuard` | Exige confirmação de e-mail para operações críticas |

---

## Health Checks

### `GET /health` — público

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "BUFFS API",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "port": 3001
}
```

### `GET /health/detailed` — autenticado

Retorna status detalhado de todos os serviços dependentes: banco, Gemini e RabbitMQ, além de métricas de memória e informações do processo Node.

---

## Testes

```bash
# Unitários
npm run test

# Watch mode
npm run test:watch

# End-to-end
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## Deploy

O deploy é feito via **GitHub Actions** (`.github/workflows/deploy.yml`). A pipeline:

1. Faz checkout de `buffs-api`, `buffs-etl-worker` e `buffs-ia`
2. Builda as 3 imagens Docker
3. Empacota e envia ao servidor via SCP
4. Conecta via SSH, restaura o `.env`, carrega as imagens e sobe a stack com `docker compose`
5. Executa health check na API antes de finalizar

### Variáveis de ambiente em produção

```env
NODE_ENV=production
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
ETL_BASE_URL=http://buffs-etl-worker:8081
IA_API_URL=http://buffs-ia:8000
CORS_ORIGIN=https://app.seudominio.com
NODE_OPTIONS=--max-old-space-size=256
```

> Os hostnames usam a rede interna do Docker Compose em produção.

---

## Contato

- **Email:** buffsapp@gmail.com
- **Issues:** [GitHub Issues](https://github.com/AgroCore-co/buffs-api/issues)

---

<div align="center">
  Desenvolvido por <a href="https://github.com/AgroCore-co">AgroCore</a>
</div>