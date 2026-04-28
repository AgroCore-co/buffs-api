# SYNC - Rotas e Contrato

## SYNC-ROUTE-001 - Conjunto de rotas offline-first por propriedade

- Contexto de negocio:
  O app mobile precisa sincronizar dados por recurso sem depender de muitas chamadas individuais.

- Regra principal:
  O modulo deve expor as seguintes rotas GET em /sync/:id_propriedade:
  - /bufalos
  - /lactacao
  - /grupos
  - /racas
  - /dados-zootecnicos
  - /medicamentos
  - /dados-sanitarios
  - /alertas
  - /coberturas
  - /material-genetico
  - /dashboard/lactacao
  - /dashboard/producao-mensal
  - /dashboard/reproducao
  - /dashboard

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  404 para recurso de propriedade sem acesso; 400 para parametros invalidos.

- Criterio de aceite:
  Todas as rotas acima estao implementadas no SyncController.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.controller.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.controller.spec.ts

- Status:
  implementada

## SYNC-ROUTE-002 - Parametro updated_at fica reservado para sincronizacao incremental futura

- Contexto de negocio:
  A estrategia incremental sera adotada em evolucao futura sem quebrar o contrato atual.

- Regra principal:
  Rotas de sync aceitam updated_at no DTO de query, mas nao aplicam filtro incremental nesta entrega.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  400 quando updated_at nao for uma data ISO valida.

- Criterio de aceite:
  Campo updated_at existe no DTO de sync e e tratado como parametro reservado.

- Rastreabilidade para codigo e testes:
  src/modules/sync/dto/sync-pagination.dto.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ROUTE-003 - Endpoints de dashboard no sync retornam pacote unico

- Contexto de negocio:
  Dados de dashboard sao agregados e nao representam colecoes paginaveis no formato tradicional.

- Regra principal:
  Rotas /dashboard* em sync devem aceitar page/limit para manter contrato comum, mas retornar data com um item agregado e total igual a 1.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Service de sync empacota retorno de DashboardService em data[0] com id, updated_at e deleted_at.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.service.ts
  src/modules/dashboard/dashboard.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada
