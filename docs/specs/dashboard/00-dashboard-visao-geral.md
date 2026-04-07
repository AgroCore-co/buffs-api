# DASHBOARD - Visao Geral

## DASH-ARCH-001 - Endpoints do dashboard exigem autenticacao e propriedade valida

- Contexto de negocio:
  Indicadores da propriedade nao devem ser expostos para requests anonimas ou com id invalido.

- Regra principal:
  Controller de dashboard deve exigir SupabaseAuthGuard e PropertyExistsGuard em todas as rotas do modulo.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  401 para token ausente/invalido; 404 para propriedade inexistente.

- Criterio de aceite:
  Todas as rotas de dashboard estao sob @UseGuards(SupabaseAuthGuard, PropertyExistsGuard).

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts
  src/core/guards/property-exists.guard.ts

- Status:
  implementada

## DASH-ARCH-002 - Parametros de rota e query saneados

- Contexto de negocio:
  Metricas dependem de id_propriedade valido e ano opcional em formato numerico.

- Regra principal:
  id_propriedade deve passar por ParseUUIDPipe e parametro ano deve ser parseado para inteiro quando informado.

- Excecoes:
  Quando ano nao for informado, service deve usar ano corrente.

- Erros esperados:
  400 para UUID invalido ou ano nao numerico.

- Criterio de aceite:
  Rotas com parametro de propriedade usam ParseUUIDPipe e query ano usa ParseIntPipe opcional.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts

- Status:
  implementada

## DASH-ARCH-003 - Caching por endpoint de leitura

- Contexto de negocio:
  Dashboard realiza agregacoes custosas e deve reduzir latencia em leituras repetidas.

- Regra principal:
  Endpoints de stats, lactacao e producao mensal devem usar CacheInterceptor com TTL dedicado.

- Excecoes:
  Endpoint de reproducao nao possui TTL explicito no estado atual.

- Erros esperados:
  Nao aplicavel como erro de dominio.

- Criterio de aceite:
  TTL de 300s em lactacao/stats e 600s em producao mensal.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts

- Status:
  implementada

## DASH-SEC-001 - Isolamento por ownership de propriedade

- Contexto de negocio:
  Em ambiente multi-tenant, usuario autenticado nao deve consultar metricas de propriedade alheia.

- Regra principal:
  Rotas de dashboard deveriam validar associacao do usuario autenticado com id_propriedade consultado.

- Excecoes:
  Sem excecoes de negocio.

- Erros esperados:
  403/404 quando usuario nao tiver acesso a propriedade.

- Criterio de aceite:
  Nao ha validacao explicita de ownership no modulo; apenas autenticacao e existencia da propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/dashboard/dashboard.controller.ts
  src/modules/dashboard/dashboard.service.ts

- Status:
  parcial
