# CORE - Utils

## CORE-UTIL-001 - Formatacao de data apenas para exibicao

- Contexto de negocio:
  Datas precisam ser exibidas no padrao local sem quebrar semantica de armazenamento.

- Regra principal:
  Utilitarios de formatacao devem ser usados para resposta/apresentacao, nunca para calculo de regra ou query.

- Excecoes:
  Sem excecoes previstas.

- Erros esperados:
  Em input invalido, formatadores retornam null em vez de lancar excecao.

- Criterio de aceite:
  Campos dt_* e *_at podem ser formatados automaticamente em respostas.

- Rastreabilidade para codigo e testes:
  src/core/utils/date-formatter.utils.ts

- Status:
  implementada

## CORE-UTIL-002 - Higienizacao de payload para Drizzle

- Contexto de negocio:
  Operacoes com ORM exigem tratamento consistente de undefined/null.

- Regra principal:
  sanitizeForDrizzle converte undefined para null; removeUndefined elimina campos undefined em updates parciais.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Payload de insert/update chega ao repositorio sem undefined indevido.

- Rastreabilidade para codigo e testes:
  src/core/utils/drizzle.utils.ts

- Status:
  implementada

## CORE-UTIL-003 - Tratamento type-safe de erro

- Contexto de negocio:
  Blocos catch recebem unknown e precisam de extracao segura de mensagem/stack.

- Regra principal:
  Helpers de erro devem normalizar mensagem e stack sem cast inseguro.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Servicos usam getErrorMessage/getErrorStack/isAxiosError em blocos de erro.

- Rastreabilidade para codigo e testes:
  src/core/utils/error.utils.ts
  src/modules/data-ingestion/services/data-ingestion.service.ts
  src/core/gemini/gemini.service.ts

- Status:
  implementada

## CORE-UTIL-004 - Contrato padrao de resposta paginada

- Contexto de negocio:
  Endpoints paginados precisam retornar metadados uniformes para clientes.

- Regra principal:
  createPaginatedResponse e calculatePaginationParams centralizam paginacao e metadados.

- Excecoes:
  Sem excecoes nos endpoints paginados.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Respostas incluem totalPages, hasNextPage e hasPrevPage calculados de forma consistente.

- Rastreabilidade para codigo e testes:
  src/core/utils/pagination.utils.ts
  src/core/dto/pagination.dto.ts

- Status:
  implementada

## CORE-UTIL-005 - Similaridade textual para normalizacao

- Contexto de negocio:
  Dados textuais (ex: doencas) chegam com variacao de escrita e digitacao.

- Regra principal:
  Utilitario de similaridade deve usar distancia de Levenshtein e limiar configuravel para agrupar termos.

- Excecoes:
  Strings vazias retornam nao similar.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  areSimilar e groupSimilarStrings agrupam termos proximos conforme threshold.

- Rastreabilidade para codigo e testes:
  src/core/utils/string-similarity.utils.ts

- Status:
  implementada
