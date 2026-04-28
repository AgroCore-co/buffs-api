# SYNC - Visao Geral

## SYNC-ARCH-001 - Rotas de sync usam escopo por propriedade e autenticacao obrigatoria

- Contexto de negocio:
  O app mobile precisa baixar dados de forma eficiente e segura por propriedade.

- Regra principal:
  Endpoints de sync devem exigir autenticacao JWT, validar existencia da propriedade e validar acesso do usuario autenticado a propriedade solicitada.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  401 para token ausente/invalido; 404 para propriedade inexistente; 404 para propriedade sem vinculo com o usuario.

- Criterio de aceite:
  SyncController usa SupabaseAuthGuard e PropertyExistsGuard; SyncService usa AuthHelperService.validatePropriedadeAccess.

- Rastreabilidade para codigo e testes:
  src/modules/sync/sync.controller.ts
  src/modules/sync/sync.service.ts
  src/core/services/auth-helper.service.ts
  src/core/guards/property-exists.guard.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ARCH-002 - Paginacao de sync possui limite maximo de 200

- Contexto de negocio:
  Sincronizacao mobile em redes instaveis precisa reduzir numero de chamadas, mas sem permitir payload excessivo.

- Regra principal:
  Query de sync deve aceitar page >= 1 e limit entre 1 e 200, com default de limit em 200.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  400 para page/limit fora da faixa valida.

- Criterio de aceite:
  DTO de sync valida page/limit e limita requests acima de 200.

- Rastreabilidade para codigo e testes:
  src/modules/sync/dto/sync-pagination.dto.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ARCH-003 - Contrato de resposta do sync e padronizado para mobile offline

- Contexto de negocio:
  O cliente mobile precisa de um payload consistente para persistencia local e controle de janela de sincronizacao.

- Regra principal:
  Todas as respostas do modulo sync devem retornar data e meta com campos page, limit, total, updated_at e synced_at.

- Excecoes:
  Endpoints de dashboard retornam data com um unico item agregado, mas mantem o mesmo contrato de meta.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Todas as rotas do modulo sync seguem o mesmo envelope de resposta.

- Rastreabilidade para codigo e testes:
  src/modules/sync/dto/sync-response.dto.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada

## SYNC-ARCH-004 - Payload de sync inclui ativos e removidos logicamente

- Contexto de negocio:
  Mobile offline precisa detectar remocoes para refletir exclusoes no banco local.

- Regra principal:
  Consultas de sync devem incluir registros ativos e soft-deleted, com alias de id, updated_at e deleted_at em cada item.

- Excecoes:
  Sem excecoes no modulo atual.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repositorio de sync nao aplica filtro deletedAt IS NULL e service normaliza aliases id/updated_at/deleted_at.

- Rastreabilidade para codigo e testes:
  src/modules/sync/repositories/sync.repository.ts
  src/modules/sync/sync.service.ts
  src/modules/sync/sync.service.spec.ts

- Status:
  implementada
