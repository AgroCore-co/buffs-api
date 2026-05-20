# SYNC - Rotas e Contrato

## SYNC-ROUTE-001 - Conjunto de rotas offline-first em /sync

- Contexto de negocio:
  O app mobile precisa sincronizar dados por recurso sem depender de muitas chamadas individuais.

- Regra principal:
  O modulo deve expor as seguintes rotas GET em /sync:
  - /bufalos
  - /lactacao/ciclos
  - /sanitario/eventos
  - /reproducao
  - /zootecnico/pesagens
  - /grupos
  - /alertas
  - /medicacoes
  - /racas

  As rotas acima retornam um array direto (sem data/meta) e incluem registros soft-deleted. O parametro propriedadeId e obrigatorio para todas, exceto /sync/racas.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  401 para token ausente/invalido; 404 para propriedade sem acesso; 400 para propriedadeId invalido.

- Criterio de aceite:
  Todas as rotas acima estao implementadas no SyncController e delegam para o SyncService.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.controller.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/repositories/sync-bufalos.repository.ts
  src/modules/sync/repositories/sync-ciclos-lactacao.repository.ts
  src/modules/sync/repositories/sync-eventos-sanitarios.repository.ts
  src/modules/sync/repositories/sync-reproducao.repository.ts
  src/modules/sync/repositories/sync-pesagens.repository.ts
  src/modules/sync/repositories/sync-grupos.repository.ts
  src/modules/sync/repositories/sync-alertas.repository.ts
  src/modules/sync/repositories/sync-racas.repository.ts
  src/modules/sync/repositories/sync-medicacoes.repository.ts

- Status:
  implementada

## SYNC-ROUTE-002 - Parametro updated_at habilita sincronizacao incremental

- Contexto de negocio:
  A estrategia incremental reduz payload e tempo de sync ao enviar apenas dados alterados.

- Regra principal:
  Se updated_at for informado (ISO 8601), as rotas offline-first retornam apenas registros com updatedAt >= updated_at. Quando ausente, retornam o conjunto completo.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  400 quando updated_at nao for uma data ISO valida.

- Criterio de aceite:
  Repositorios offline-first aplicam gte(updatedAt, updated_at) quando o parametro e informado.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.service.ts
  src/modules/sync/repositories/sync-bufalos.repository.ts
  src/modules/sync/repositories/sync-ciclos-lactacao.repository.ts
  src/modules/sync/repositories/sync-eventos-sanitarios.repository.ts
  src/modules/sync/repositories/sync-reproducao.repository.ts
  src/modules/sync/repositories/sync-pesagens.repository.ts
  src/modules/sync/repositories/sync-grupos.repository.ts
  src/modules/sync/repositories/sync-alertas.repository.ts
  src/modules/sync/repositories/sync-racas.repository.ts
  src/modules/sync/repositories/sync-medicacoes.repository.ts

- Status:
  implementada

## SYNC-ROUTE-003 - Rotas legacy por propriedade permanecem com paginacao

- Contexto de negocio:
  Clientes antigos ainda usam rotas paginadas e precisam manter o envelope data/meta.

- Regra principal:
  O modulo mantem as seguintes rotas GET em /sync/:id_propriedade:
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

  Essas rotas aceitam page/limit via SyncPaginationDto e retornam o envelope data/meta. O parametro updated_at permanece reservado nas rotas legacy.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  404 para recurso de propriedade sem acesso; 400 para page/limit fora da faixa valida.

- Criterio de aceite:
  Todas as rotas acima estao implementadas no SyncController e usam SyncPaginationDto.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.controller.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/dto/sync-pagination.dto.ts
  src/modules/sync/sync.controller.spec.ts
  src/modules/sync/sync.service.spec.ts

## SYNC-ROUTE-004 - Endpoints de dashboard no sync retornam pacote unico

- Contexto de negocio:
  Dados de dashboard sao agregados e nao representam colecoes paginaveis no formato tradicional.

- Regra principal:
  Rotas /dashboard* em sync legacy aceitam page/limit para manter contrato comum, mas retornam data com um item agregado e total igual a 1.

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
