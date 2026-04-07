# DASHBOARD - Integracao com Core

## DASH-CORE-001 - Dashboard usa modulo e providers basicos do Core

- Contexto de negocio:
  Endpoints de dashboard dependem de acesso a banco e logging padronizado.

- Regra principal:
  DashboardModule deve importar DatabaseModule e LoggerModule do Core para suportar repository e service.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Falha de DI quando providers do Core nao estiverem disponiveis.

- Criterio de aceite:
  DashboardModule importa DatabaseModule e LoggerModule.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.module.ts

- Status:
  implementada

## DASH-CORE-002 - PropertyExistsGuard do Core e aplicado em todas as rotas do controller

- Contexto de negocio:
  Dashboard precisa rejeitar propriedades inexistentes antes de executar agregacoes.

- Regra principal:
  DashboardController deve usar PropertyExistsGuard em nivel de classe junto com autenticacao.

- Excecoes:
  Guard valida existencia, nao ownership.

- Erros esperados:
  NotFoundException quando id_propriedade nao existir.

- Criterio de aceite:
  Controller aplica @UseGuards(SupabaseAuthGuard, PropertyExistsGuard).

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts
  src/core/guards/property-exists.guard.ts

- Status:
  implementada

## DASH-CORE-003 - LoggerService e utilitario de data do Core sao usados em service/repository

- Contexto de negocio:
  Agregacoes de dashboard exigem observabilidade e formato de data consistente.

- Regra principal:
  DashboardService e DashboardRepository devem usar LoggerService; service usa formatToSimpleDate para saida de reproducao.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException para falhas de consulta/processamento, com log estruturado.

- Criterio de aceite:
  Service e repository registram erros com logger.logError e service usa utilitario de data do Core.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.service.ts
  src/modules/dashboard/repositories/dashboard.repository.drizzle.ts
  src/core/logger/logger.service.ts
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## DASH-CORE-004 - Integracao com cache e aplicada nos endpoints de leitura principais

- Contexto de negocio:
  Dashboard e read-heavy e se beneficia de cache de curta duracao.

- Regra principal:
  Controller deve aplicar CacheInterceptor em nivel de classe e CacheTTL por endpoint conforme custo de consulta.

- Excecoes:
  Rota de reproducao nao define TTL explicito no estado atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  getStats/getLactacaoMetricas/getProducaoMensal possuem CacheTTL; controller usa @UseInterceptors(CacheInterceptor).

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts

- Status:
  implementada

## DASH-CORE-005 - Verificacao de ownership por propriedade nao usa helper central do Core

- Contexto de negocio:
  Em multi-tenant, existencia de propriedade nao garante que o usuario autenticado pode acessar seus dados.

- Regra principal:
  Dashboard deveria validar acesso por ownership/vinculo usando AuthHelperService (ou regra equivalente), alem de existencia da propriedade.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  403/404 para tentativa de acesso a propriedade fora do escopo do usuario.

- Criterio de aceite:
  No estado atual, dashboard usa PropertyExistsGuard mas nao usa AuthHelperService para validar escopo do usuario.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts
  src/modules/dashboard/dashboard.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## DASH-CORE-006 - Reuso de DTO/decorator/validator compartilhado do Core e limitado

- Contexto de negocio:
  Core contem DTO/decorators/validators compartilhados que podem reduzir inconsistencias de contrato.

- Regra principal:
  Modulo dashboard usa DTOs proprios e pipes nativos, sem reuso de PaginationDto, decorator to-boolean e validators customizados de data do Core.

- Excecoes:
  Pode ser intencional pela natureza agregada dos endpoints atuais.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Nao foram encontradas referencias a esses artefatos compartilhados no modulo dashboard.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/
  src/core/dto/pagination.dto.ts
  src/core/decorators/to-boolean.decorator.ts
  src/core/validators/date.validators.ts

- Status:
  parcial

## DASH-TEST-001 - Cobertura de testes dedicada do modulo dashboard

- Contexto de negocio:
  Regras de agregacao e classificacao possuem risco de regressao e precisam teste especifico.

- Regra principal:
  Modulo deveria possuir testes unitarios/e2e dedicados para endpoints /dashboard e seus calculos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual nao foram encontradas referencias diretas a rotas /dashboard em test/.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/
  test/

- Status:
  parcial
