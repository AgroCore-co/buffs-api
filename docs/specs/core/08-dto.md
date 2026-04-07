# CORE - DTO Compartilhado

## CORE-DTO-001 - Paginacao com limites saneados

- Contexto de negocio:
  Endpoints paginados precisam evitar consultas excessivas e entradas invalidas.

- Regra principal:
  DTO de paginacao deve aceitar page >= 1 e limit entre 1 e 100.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Erro de validacao quando page/limit estiverem fora do intervalo.

- Criterio de aceite:
  Validacao rejeita payload fora da faixa permitida.

- Rastreabilidade para codigo e testes:
  src/core/dto/pagination.dto.ts

- Status:
  implementada

## CORE-DTO-002 - Defaults de paginacao previsiveis

- Contexto de negocio:
  Clientes podem omitir query params e ainda assim precisam de resposta consistente.

- Regra principal:
  page padrao deve ser 1 e limit padrao deve ser 10.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel para fluxo default.

- Criterio de aceite:
  Ausencia de parametros retorna primeira pagina com 10 itens.

- Rastreabilidade para codigo e testes:
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## CORE-DTO-003 - Resposta paginada com metadados obrigatorios

- Contexto de negocio:
  Frontend e consumidores dependem de metadados para navegacao de pagina.

- Regra principal:
  Toda resposta paginada deve conter data e meta (page, limit, total, totalPages, hasNextPage, hasPrevPage).

- Excecoes:
  Sem excecoes em endpoints paginados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Estrutura de resposta segue contrato PaginatedResponse.

- Rastreabilidade para codigo e testes:
  src/core/dto/pagination.dto.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada
