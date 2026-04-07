# DATA-INGESTION - Integracao com Core

## DING-CORE-001 - Modulo reutiliza infraestrutura compartilhada para auth, cache e observabilidade

- Contexto de negocio:
  Operacao de ingestao exige autenticacao, limitacao por cache e logs estruturados.

- Regra principal:
  DataIngestionModule deve importar LoggerModule, AuthModule e CacheConfigModule, alem de ConfigModule e HttpModule para integracao externa.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando modulo compartilhado nao estiver registrado.

- Criterio de aceite:
  Imports do modulo incluem LoggerModule, AuthModule, CacheConfigModule, ConfigModule e HttpModule com timeout configurado.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/data-ingestion.module.ts

- Status:
  implementada

## DING-CORE-002 - AuthHelperService centraliza identificacao do usuario e acesso por propriedade

- Contexto de negocio:
  Regras multi-tenant precisam padrao unico para mapear usuario autenticado e validar escopo.

- Regra principal:
  DataIngestionService deve usar getUserId e validator deve usar hasAccessToPropriedade para import/export.

- Excecoes:
  Consulta de status de job nao aplica validacao por propriedade no fluxo atual.

- Erros esperados:
  NotFoundException para perfil ausente e 403 para propriedade fora do escopo.

- Criterio de aceite:
  Service chama authHelper.getUserId; validator chama authHelper.hasAccessToPropriedade.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## DING-CORE-003 - CacheService do Core e usado para rate limit por propriedade

- Contexto de negocio:
  Contencao de carga de importacao depende de contador compartilhado entre requisicoes.

- Regra principal:
  Validator deve usar cache para armazenar contagem de importacoes por janela de 1 hora.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  429 quando limite for atingido.

- Criterio de aceite:
  checkRateLimit usa cacheService.get/set com chave data-ingestion:rate:{propriedadeId}.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/cache/cache.service.ts

- Status:
  implementada

## DING-CORE-004 - LoggerService compartilhado e aplicado em todas as camadas do modulo

- Contexto de negocio:
  Observabilidade de ingestao exige trilha de request, pipeline, integracao ETL e job agendado.

- Regra principal:
  Controllers, service, pipelines, validator, mapper, client ETL e job devem registrar eventos no LoggerService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Componentes do modulo recebem LoggerService via DI e usam log, warn, debug ou logError.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/services/etl-http-client.service.ts
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/modules/data-ingestion/mappers/data-ingestion.mapper.ts
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts
  src/core/logger/logger.service.ts

- Status:
  implementada

## DING-CORE-005 - Utilitario de erro do Core padroniza logs em falhas inesperadas

- Contexto de negocio:
  Normalizar mensagem de erro reduz ruidao em logs e melhora diagnostico de indisponibilidade.

- Regra principal:
  Pipelines e DataIngestionService devem usar getErrorMessage para fallback de erros unknown.

- Excecoes:
  EtlHttpClient nao aplica esse utilitario diretamente.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Importacao/exportacao e status de job fazem logError com getErrorMessage em cenarios nao HttpException.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/modules/data-ingestion/pipelines/leite.pipeline.ts
  src/modules/data-ingestion/pipelines/pesagem.pipeline.ts
  src/modules/data-ingestion/pipelines/reproducao.pipeline.ts
  src/core/utils/error.utils.ts

- Status:
  implementada

## DING-CORE-006 - Scheduler de manutencao depende da infraestrutura global de agendamento

- Contexto de negocio:
  Limpeza automatica de uploads so executa quando infraestrutura de cron estiver habilitada na aplicacao.

- Regra principal:
  Job de cleanup deve ser registrado como provider e executado com suporte do ScheduleModule global.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem ScheduleModule ativo, cron nao executa.

- Criterio de aceite:
  AppModule importa ScheduleModule.forRoot e DataIngestionModule registra ScheduledIngestionJob como provider.

- Rastreabilidade para codigo e testes:
  src/app.module.ts
  src/modules/data-ingestion/data-ingestion.module.ts
  src/modules/data-ingestion/jobs/scheduled-ingestion.job.ts

- Status:
  implementada

## DING-CORE-007 - Guard de cargo e aplicado sem metadata de role no modulo

- Contexto de negocio:
  Reuso de RolesGuard do Core/Auth so e efetivo quando endpoints declaram roles.

- Regra principal:
  Caso controle de cargo seja necessario, modulo deve declarar @Roles nas rotas.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, ausencia de @Roles faz RolesGuard permitir passagem em todas as rotas do modulo.

- Criterio de aceite:
  RolesGuard retorna true quando requiredRoles nao existe e controller de data-ingestion nao declara @Roles.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/auth/guards/roles.guard.ts

- Status:
  parcial

## DING-CORE-008 - Validacao de propriedade nao usa PropertyExistsGuard

- Contexto de negocio:
  Modulo adota validacao de escopo por helper, mas nao faz etapa explicita de existencia de propriedade via guard dedicado.

- Regra principal:
  Fluxos de import/export validam acesso por hasAccessToPropriedade, sem aplicar PropertyExistsGuard na rota.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Propriedade invalida pode resultar em 403 por falta de acesso, sem distinguir claramente inexistencia de ownership.

- Criterio de aceite:
  Controller nao usa PropertyExistsGuard e validator usa apenas hasAccessToPropriedade.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion/controllers/data-ingestion.controller.ts
  src/modules/data-ingestion/validators/data-ingestion.validator.ts
  src/core/guards/property-exists.guard.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## DING-CORE-009 - Nao ha cobertura automatizada dedicada para integracao com Core

- Contexto de negocio:
  Fluxos de validacao de acesso, limite em cache e tratamento de erro do ETL precisam testes para evitar regressao.

- Regra principal:
  Modulo deveria possuir suites unitarias/e2e para validar comportamento de integracao com AuthHelperService, CacheService e LoggerService.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Sem testes dedicados, alteracoes no Core podem quebrar ingestao sem deteccao rapida.

- Criterio de aceite:
  Nao foram encontrados testes .spec.ts no modulo data-ingestion nem testes e2e dedicados para o dominio.

- Rastreabilidade para codigo e testes:
  src/modules/data-ingestion
  test/

- Status:
  parcial
