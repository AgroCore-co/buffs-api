# SYNC - Visao Geral

## SYNC-ARCH-001 - Rotas de sync exigem autenticacao e validacao de acesso por propriedade

- Contexto de negocio:
  O app mobile precisa baixar dados de forma eficiente e segura por propriedade.

- Regra principal:
  Endpoints de sync exigem autenticacao JWT; propriedadeId e informado via query nas rotas offline-first e via parametro nas rotas legacy. O acesso e validado com AuthHelperService.validatePropriedadeAccess antes de executar a consulta.

- Excecoes:
  /sync/racas nao exige propriedadeId.

- Erros esperados:
  401 para token ausente/invalido; 404 para propriedade inexistente ou sem vinculo com o usuario.

- Criterio de aceite:
  SyncController usa SupabaseAuthGuard e SyncService chama AuthHelperService.validatePropriedadeAccess nas rotas com propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.controller.ts
  src/modules/sync/sync.service.ts
  src/core/services/auth-helper.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ARCH-002 - Paginacao so se aplica as rotas legacy do sync

- Contexto de negocio:
  Sincronizacao batch precisa limitar payload em rotas legadas sem quebrar clientes existentes.

- Regra principal:
  Rotas legacy em /sync/:id_propriedade aceitam page >= 1 e limit entre 1 e 200 (default 200). Rotas offline-first em /sync/* nao usam paginacao.

- Excecoes:
  Rotas /dashboard* em legacy retornam pacote unico, mas ainda aceitam page/limit.

- Erros esperados:
  400 para page/limit fora da faixa valida.

- Criterio de aceite:
  SyncPaginationDto valida page/limit e SyncService aplica limites nas rotas legacy.

- Rastreabilidade para codigo e testes:
  src/modules/sync/dto/sync-pagination.dto.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ARCH-003 - Contrato offline-first retorna array direto e inclui soft-delete

- Contexto de negocio:
  O cliente mobile precisa popular SQLite com todos os registros e remover itens deletados.

- Regra principal:
  Rotas offline-first em /sync retornam um array direto, sem envelope de paginacao. As consultas incluem registros ativos e removidos logicamente, preservando campos camelCase (incluindo deletedAt e updatedAt).

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repositorios offline-first nao aplicam filtro deletedAt IS NULL e expoem os dados com os campos originais do schema.

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

## SYNC-ARCH-004 - Contrato legacy mantem envelope data/meta

- Contexto de negocio:
  Clientes antigos ainda dependem do envelope paginado do sync.

- Regra principal:
  Rotas legacy em /sync/:id_propriedade retornam data e meta com page, limit, total, updated_at e synced_at. Cada item recebe alias id, updated_at e deleted_at.

- Excecoes:
  Rotas /dashboard* em legacy retornam data com um unico item agregado e total igual a 1.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  SyncService aplica buildCollectionResponse/buildDashboardResponse nas rotas legacy.

- Rastreabilidade para codigo e testes:
  src/modules/sync/dto/sync-response.dto.ts
  src/modules/sync/repositories/sync.repository.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada
