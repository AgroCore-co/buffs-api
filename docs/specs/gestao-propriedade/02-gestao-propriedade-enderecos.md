# GESTAO-PROPRIEDADE - Enderecos

## GPROP-END-001 - Criacao de endereco como etapa previa da propriedade

- Contexto de negocio:
  Propriedade depende de endereco previamente cadastrado para concluir onboarding.

- Regra principal:
  POST /enderecos deve criar endereco com validacoes de DTO e retornar idEndereco para uso em /propriedades.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  InternalServerErrorException em falha de persistencia.

- Criterio de aceite:
  Controller chama service de create e service grava endereco via repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/endereco.controller.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts

- Status:
  implementada

## GPROP-END-002 - Listagem de enderecos filtrada por propriedades acessiveis

- Contexto de negocio:
  Endereco so deve aparecer para usuarios com acesso a propriedades vinculadas.

- Regra principal:
  GET /enderecos deve derivar propriedades acessiveis do usuario e listar apenas enderecos vinculados a essas propriedades.

- Excecoes:
  Quando usuario nao possuir propriedades, resposta retorna lista vazia.

- Erros esperados:
  InternalServerErrorException para falhas nao mapeadas de infraestrutura.

- Criterio de aceite:
  Service usa authHelper.getUserPropriedades e repositorio buscarPorPropriedades.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts
  src/core/services/auth-helper.service.ts

- Status:
  implementada

## GPROP-END-003 - Consulta por ID exige pertencimento ao escopo do usuario

- Contexto de negocio:
  Leitura de um endereco especifico deve respeitar isolamento por propriedade.

- Regra principal:
  GET /enderecos/:id deve retornar endereco apenas quando vinculado a propriedade acessivel ao usuario.

- Excecoes:
  Se usuario nao possui propriedades acessiveis, retorno deve ser not found.

- Erros esperados:
  NotFoundException para endereco fora de escopo ou inexistente.

- Criterio de aceite:
  Service chama buscarPorIdComPropriedades com lista de propriedades acessiveis.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts

- Status:
  implementada

## GPROP-END-004 - Update e remove validam acesso antes da escrita

- Contexto de negocio:
  Usuario nao deve editar/remover endereco sem vinculo com propriedades sob seu escopo.

- Regra principal:
  PATCH/DELETE /enderecos/:id devem reaproveitar validacao de findOne antes de escrever.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  NotFoundException para endereco sem acesso; InternalServerErrorException para falha de escrita.

- Criterio de aceite:
  update/remove executam findOne previamente e so depois atualizam/removem no repositorio.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts

- Status:
  implementada

## GPROP-END-005 - Remocao de endereco usa soft delete

- Contexto de negocio:
  Enderecos removidos nao devem sumir fisicamente quando historico pode ser relevante.

- Regra principal:
  Operacao de delete em endereco deve atualizar deletedAt em vez de delete fisico.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  Repositorio remove com update de deletedAt e consultas filtram isNull(deletedAt).

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/repositories/endereco.repository.drizzle.ts
  src/database/schema.ts

- Status:
  implementada

## GPROP-END-006 - Cache de leitura sem invalidacao nas escritas

- Contexto de negocio:
  Endpoints de GET de endereco usam TTL de 3600s; sem invalidacao, atualizacoes/remocoes podem demorar a refletir.

- Regra principal:
  Fluxos de create/update/delete deveriam invalidar cache de listagem/consulta de enderecos.

- Excecoes:
  Sem excecoes.

- Erros esperados:
  Nao aplicavel.

- Criterio de aceite:
  No estado atual ha CacheInterceptor/CacheTTL em GETs, mas sem invalidacao explicita no service.

- Rastreabilidade para codigo e testes:
  src/modules/gestao-propriedade/endereco/endereco.controller.ts
  src/modules/gestao-propriedade/endereco/endereco.service.ts
  src/core/cache/cache.service.ts

- Status:
  parcial
