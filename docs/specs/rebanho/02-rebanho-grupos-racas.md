# REBANHO - Grupos e Racas

## REB-GRP-001 - Grupo possui CRUD com soft delete e restore

- Contexto de negocio:
  Grupos de manejo mudam ao longo do ciclo produtivo, mas historico de estrutura deve ser preservado.

- Regra principal:
  GrupoService deve permitir criar, listar, atualizar, remover logicamente e restaurar grupos.

- Excecoes:
  Restore so pode ocorrer quando o grupo estiver removido.

- Erros esperados:
  NotFoundException para grupo inexistente; BadRequestException para restauracao de grupo nao removido.

- Criterio de aceite:
  Fluxo remove executa softDelete (deletedAt) e restore remove marcacao de exclusao.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/grupo.service.ts
  src/modules/rebanho/grupo/repositories/grupo.repository.drizzle.ts

- Status:
  implementada

## REB-GRP-002 - Listagem por propriedade e paginada

- Contexto de negocio:
  Interface operacional precisa carregar grupos por propriedade sem sobrecarga de retorno.

- Regra principal:
  Endpoint por propriedade deve retornar colecao paginada com total e metadados.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  GrupoService usa calculatePaginationParams/createPaginatedResponse na listagem por propriedade.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/grupo.controller.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/core/utils/pagination.utils.ts

- Status:
  implementada

## REB-GRP-003 - Ownership por propriedade nao e validado explicitamente em grupos

- Contexto de negocio:
  Somente autenticacao nao garante que usuario pode acessar qualquer id_propriedade informado em query/path.

- Regra principal:
  Endpoints de grupo por propriedade deveriam validar vinculo usuario-propriedade antes da consulta/escrita.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  No estado atual, fluxo depende apenas de autenticacao e pode nao bloquear acesso por escopo de propriedade no service.

- Criterio de aceite:
  GrupoController/GrupoService nao recebem usuario nas operacoes de propriedade e nao usam helper central de ownership.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/grupo/grupo.controller.ts
  src/modules/rebanho/grupo/grupo.service.ts
  src/core/services/auth-helper.service.ts

- Status:
  parcial

## REB-RAC-001 - Catalogo de racas possui CRUD com remocao logica

- Contexto de negocio:
  Racas sao referencia transversal para classificacao de animais e nao devem ser apagadas fisicamente sem controle.

- Regra principal:
  RacaService deve suportar create, read, update, soft delete e restore de racas.

- Excecoes:
  Restore so pode ocorrer para registro removido.

- Erros esperados:
  NotFoundException para raca inexistente; BadRequestException para restore invalido.

- Criterio de aceite:
  RacaRepository usa deletedAt para soft delete/restore e service aplica validacoes de estado.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/raca/raca.service.ts
  src/modules/rebanho/raca/repositories/raca.repository.drizzle.ts

- Status:
  implementada

## REB-RAC-002 - Leituras de raca e grupo usam cache com TTL

- Contexto de negocio:
  Catalogos de baixa mutacao podem reduzir custo de consulta com cache de leitura.

- Regra principal:
  Endpoints GET de raca e principais GET de grupo aplicam CacheInterceptor e CacheTTL.

- Excecoes:
  Operacoes de escrita nao possuem invalidacao explicita no modulo.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Controllers de raca e grupo contem @UseInterceptors(CacheInterceptor) e @CacheTTL nos endpoints de leitura.

- Rastreabilidade para codigo e testes:
  src/modules/rebanho/raca/raca.controller.ts
  src/modules/rebanho/grupo/grupo.controller.ts

- Status:
  implementada